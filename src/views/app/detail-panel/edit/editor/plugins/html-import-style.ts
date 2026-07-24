/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	$isTextNode,
	TextNode,
	type DOMChildConversion,
	type DOMConversionMap,
	type DOMConversionOutput
} from 'lexical';

const STYLE_PROPERTIES = ['color', 'backgroundColor', 'fontFamily', 'fontSize'] as const;

function toCssPropertyName(property: string): string {
	return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function extractInlineTextStyle(style: CSSStyleDeclaration): string {
	return STYLE_PROPERTIES.filter((property) => style[property]).reduce(
		(css, property) => `${css}${css ? '; ' : ''}${toCssPropertyName(property)}: ${style[property]}`,
		''
	);
}

function withPreservedTextStyle(
	styleToPreserve: string,
	base: DOMConversionOutput
): DOMConversionOutput {
	if (!styleToPreserve) {
		return base;
	}
	const baseForChild = base.forChild;
	const forChild: DOMChildConversion = (lexicalNode, parentLexicalNode) => {
		const node = baseForChild ? baseForChild(lexicalNode, parentLexicalNode) : lexicalNode;
		if (node && $isTextNode(node)) {
			const existingStyle = node.getStyle();
			node.setStyle(existingStyle ? `${existingStyle}; ${styleToPreserve}` : styleToPreserve);
		}
		return node;
	};
	return { ...base, forChild };
}

/**
 * Every tag `TextNode.importDOM` registers a converter for that can carry an
 * inline `style` attribute. Lexical exports bold/italic/underline/
 * strikethrough/code/sub/superscript text via these semantic tags (not just
 * `<span>`) — e.g. `RichToolbarPlugin` applying both italic and a color to
 * the same run of text serializes as `<i><em style="color: ...">text</em></i>`.
 * The color lives on the same element as the format-carrying tag, so the
 * override below must cover all of them, not just `span`.
 */
const TEXT_FORMAT_TAGS = [
	'b',
	'code',
	'em',
	'i',
	'mark',
	's',
	'span',
	'strong',
	'sub',
	'sup',
	'u'
] as const;

/**
 * Lexical's built-in importers for these tags (`TextNode.importDOM`) only
 * read `font-weight` / `text-decoration` / `font-style` / `vertical-align`
 * from inline style to derive bold/italic/underline/strikethrough/sub/
 * superscript — they silently drop `color`, `background-color`,
 * `font-family` and `font-size`. Those are exactly the properties
 * `RichToolbarPlugin` writes via `$patchStyleText`, so without this override,
 * reloading previously saved HTML (switching signatures, loading a draft) or
 * pasting colored/styled text copied from elsewhere (e.g. a legacy
 * TinyMCE-authored email) silently loses that styling.
 *
 * Registered via `LexicalComposer`'s `initialConfig.html.import`, which lets
 * an override win over the built-in node-registered converters for the same
 * tag without having to reimplement them — see `getConversionFunction` in
 * `@lexical/html`, "given equal priority, prefer the last registered
 * importer".
 */
function withStylePreservingImport(tag: string): DOMConversionMap[string] {
	return (domNode) => {
		const defaultConversion = TextNode.importDOM()?.[tag]?.(domNode);
		return {
			conversion: (domElement): DOMConversionOutput => {
				const base = defaultConversion?.conversion(domElement) ?? { node: null };
				return withPreservedTextStyle(extractInlineTextStyle(domElement.style), base);
			},
			priority: 1
		};
	};
}

export const STYLE_PRESERVING_HTML_IMPORT: DOMConversionMap = {
	...Object.fromEntries(TEXT_FORMAT_TAGS.map((tag) => [tag, withStylePreservingImport(tag)])),
	font: () => ({
		conversion: (domElement): DOMConversionOutput => {
			const legacyColor = domElement.getAttribute('color');
			const legacyFace = domElement.getAttribute('face');
			const legacyStyle = [
				legacyColor && `color: ${legacyColor}`,
				legacyFace && `font-family: ${legacyFace}`
			]
				.filter(Boolean)
				.join('; ');
			const styleToPreserve = [legacyStyle, extractInlineTextStyle(domElement.style)]
				.filter(Boolean)
				.join('; ');
			return withPreservedTextStyle(styleToPreserve, { node: null });
		},
		priority: 1
	})
};
