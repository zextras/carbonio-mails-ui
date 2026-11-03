/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Attributes of block elements that are carried through the editor's HTML
 * round-trip. Lexical nodes have no place to store arbitrary attributes, so the
 * nodes that need them (see `GenericContainerNode` and `StyledParagraphNode`)
 * keep this map and write it back on export.
 *
 * It is a whitelist on purpose: event handlers (`on*`), `href`/`src` and
 * anything Lexical itself manages (`data-lexical-*`) are never preserved.
 */
const PRESERVED_ATTRIBUTES = new Set([
	'style',
	'class',
	'id',
	'dir',
	'lang',
	'title',
	'align',
	'valign',
	'bgcolor',
	'width',
	'height',
	'border',
	'cellpadding',
	'cellspacing',
	'nowrap',
	'role'
]);

/**
 * Attributes that are safe and useful to apply on the live editor element.
 * `id` and `class` are deliberately left out: the inline styles are what the
 * original is rendered with, while ids/classes taken from an external message
 * could collide with the ones of the surrounding application.
 */
const EDITOR_VIEW_ATTRIBUTES = ['style', 'dir', 'lang', 'title', 'align', 'valign', 'bgcolor'];

/** Presentational attributes that table elements need to render like the original. */
export const TABLE_EDITOR_VIEW_ATTRIBUTES = [
	...EDITOR_VIEW_ATTRIBUTES,
	'width',
	'height',
	'border',
	'cellpadding',
	'cellspacing',
	'nowrap'
];

/**
 * Style properties that would let quoted content escape its place in the
 * editor (overlay the toolbar, intercept the pointer, ...). They are removed
 * from the live editor element only; the exported HTML keeps the original value.
 */
const EDITOR_VIEW_FORBIDDEN_STYLES = [
	'position',
	'z-index',
	'top',
	'right',
	'bottom',
	'left',
	'pointer-events'
];

export type PreservedAttributes = Record<string, string>;

const isPreservedAttribute = (name: string): boolean =>
	PRESERVED_ATTRIBUTES.has(name) || (name.startsWith('data-') && !name.startsWith('data-lexical'));

export function extractPreservedAttributes(element: HTMLElement): PreservedAttributes {
	return Array.from(element.attributes).reduce<PreservedAttributes>((attributes, attribute) => {
		const name = attribute.name.toLowerCase();
		if (isPreservedAttribute(name) && attribute.value.trim() !== '') {
			return { ...attributes, [name]: attribute.value };
		}
		return attributes;
	}, {});
}

/**
 * Same as {@link extractPreservedAttributes} minus the attributes Lexical already
 * handles for paragraphs (`dir`), so that the node and Lexical do not fight
 * over the same value.
 */
export function extractParagraphAttributes(element: HTMLElement): PreservedAttributes {
	return Object.fromEntries(
		Object.entries(extractPreservedAttributes(element)).filter(([name]) => name !== 'dir')
	);
}

const BLOCK_TAGS = new Set([
	'ADDRESS',
	'ARTICLE',
	'ASIDE',
	'BLOCKQUOTE',
	'CENTER',
	'DIV',
	'FOOTER',
	'H1',
	'H2',
	'H3',
	'H4',
	'H5',
	'H6',
	'HEADER',
	'HR',
	'LI',
	'MAIN',
	'NAV',
	'OL',
	'P',
	'PRE',
	'SECTION',
	'TABLE',
	'UL'
]);

export const hasBlockChild = (element: HTMLElement): boolean =>
	Array.from(element.children).some((child) => BLOCK_TAGS.has(child.nodeName));

export function applyAttributes(element: HTMLElement, attributes: PreservedAttributes): void {
	Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
}

function parseStyle(style: string): CSSStyleDeclaration {
	const holder = document.createElement('span');
	holder.setAttribute('style', style);
	return holder.style;
}

/**
 * Copies the declarations of `style` onto `element`, over whatever the element
 * already has. Properties listed in `skip` are left as they are.
 */
export function mergeStyleDeclarations(
	element: HTMLElement,
	style: string,
	skip: string[] = []
): void {
	const declarations = parseStyle(style);
	Array.from(declarations).forEach((property) => {
		if (!skip.includes(property)) {
			element.style.setProperty(
				property,
				declarations.getPropertyValue(property),
				declarations.getPropertyPriority(property)
			);
		}
	});
}

export function applyEditorViewAttributes(
	element: HTMLElement,
	attributes: PreservedAttributes,
	allowedAttributes: string[] = EDITOR_VIEW_ATTRIBUTES,
	skippedStyles: string[] = []
): void {
	allowedAttributes.forEach((name) => {
		const value = attributes[name];
		if (value === undefined) {
			return;
		}
		if (name === 'style') {
			mergeStyleDeclarations(element, value, [...EDITOR_VIEW_FORBIDDEN_STYLES, ...skippedStyles]);
		} else {
			element.setAttribute(name, value);
		}
	});
}

export function areAttributesEqual(a: PreservedAttributes, b: PreservedAttributes): boolean {
	const aKeys = Object.keys(a);
	return aKeys.length === Object.keys(b).length && aKeys.every((key) => a[key] === b[key]);
}
