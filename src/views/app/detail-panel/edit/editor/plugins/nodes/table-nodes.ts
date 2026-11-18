/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable max-classes-per-file -- the three table nodes are replaced and registered together */
import {
	$isTableNode,
	TableCellNode,
	TableNode,
	TableRowNode,
	type SerializedTableCellNode,
	type SerializedTableNode,
	type SerializedTableRowNode
} from '@lexical/table';
import { removeClassNamesFromElement } from '@lexical/utils';
import {
	type DOMConversion,
	type DOMConversionOutput,
	type DOMConversionMap,
	type DOMExportOutput,
	type EditorConfig,
	type Klass,
	type LexicalEditor,
	type LexicalNode,
	type LexicalNodeReplacement,
	type Spread
} from 'lexical';

import {
	applyAttributes,
	applyEditorViewAttributes,
	areAttributesEqual,
	extractPreservedAttributes,
	getDeclaredStyleProperties,
	mergeStyleDeclarations,
	TABLE_EDITOR_VIEW_ATTRIBUTES,
	withoutEditorViewForbiddenStyles,
	type PreservedAttributes
} from './preserved-attributes';

/**
 * Tables, rows and cells that remember the attributes (`align`, `valign`,
 * `bgcolor`, `cellpadding`, inline `style`, `class`, ...) of the element they
 * were imported from.
 *
 * `@lexical/table` reads only the spans, the background, the vertical alignment
 * and a pixel width from a cell, and on export forces `border: 1px solid black`,
 * `text-align: start` and a fixed width on every cell. Layout tables from other
 * mail clients rely on exactly the attributes that are dropped (and have no
 * border), so replies and forwards came out misaligned.
 *
 * The subclasses replace the stock nodes (see {@link TABLE_NODES}), so tables
 * the user inserts with the toolbar are instances of them too, but those carry
 * no attributes and keep the stock look. The same goes for a table created in
 * the editor that comes back from its own HTML (draft reopened, identity
 * switched, source edited, ...): see {@link isEditorTableElement}.
 */

/** The class the editor theme gives the tables created in the editor. */
export const EDITOR_TABLE_CLASS = 'mails-lexical-table';

/**
 * Table attributes the editor never writes. Earlier versions exported
 * {@link EDITOR_TABLE_CLASS} on imported tables too, so the class alone does not
 * tell a table created in the editor from one of an older reply or draft.
 */
const FOREIGN_TABLE_ATTRIBUTES = [
	'width',
	'height',
	'border',
	'cellpadding',
	'cellspacing',
	'align',
	'bgcolor'
];

/** Whether `table` is the export of a table created in the editor. */
const isEditorTableElement = (table: Element | null): boolean =>
	table !== null &&
	table.classList.contains(EDITOR_TABLE_CLASS) &&
	FOREIGN_TABLE_ATTRIBUTES.every((name) => !table.hasAttribute(name));

type WithAttributes = { attributes: PreservedAttributes; imported: boolean };

type AttributesCarrier = LexicalNode & { __attributes: PreservedAttributes; __imported: boolean };

const carriesAttributes = (node: LexicalNode | null): node is AttributesCarrier =>
	node !== null && '__attributes' in node && '__imported' in node;

const copyAttributes = (target: AttributesCarrier, source: AttributesCarrier): void => {
	Object.assign(target, { __attributes: source.__attributes, __imported: source.__imported });
};

/** Marks `node` as imported from an element whose `attributes` it keeps. */
function markImported(node: AttributesCarrier, attributes: PreservedAttributes): void {
	Object.assign(node, { __attributes: attributes, __imported: true });
}

/**
 * The attributes of an imported table, without {@link EDITOR_TABLE_CLASS}: the
 * theme class is an editor concern that earlier versions exported on imported
 * tables, it must not reach the sent message.
 */
function extractTableAttributes(element: HTMLElement): PreservedAttributes {
	const attributes = extractPreservedAttributes(element);
	const classNames = (attributes.class ?? '').split(/\s+/);
	if (!classNames.includes(EDITOR_TABLE_CLASS)) {
		return attributes;
	}
	const { class: _themeClass, ...rest } = attributes;
	const ownClassNames = classNames.filter((name) => name !== '' && name !== EDITOR_TABLE_CLASS);
	return ownClassNames.length > 0 ? { ...rest, class: ownClassNames.join(' ') } : rest;
}

/** Rows and cells are imported unless their table was created in the editor. */
function $importTablePart(node: AttributesCarrier, element: HTMLElement): void {
	if (!isEditorTableElement(element.closest('table'))) {
		markImported(node, extractPreservedAttributes(element));
	}
}

function $importTable(node: AttributesCarrier, element: HTMLElement): void {
	if (!isEditorTableElement(element)) {
		markImported(node, extractTableAttributes(element));
	} else if ($isTableNode(node)) {
		// The inline style of a table created in the editor is the node's own (the
		// width the column resizer pinned, the layout of the theme class), shown as
		// is: the class can also come with pasted HTML, positioning must not.
		node.setStyle(withoutEditorViewForbiddenStyles(element.getAttribute('style') ?? ''));
	}
}

const wrapConversion =
	(
		stockConversion: ((node: HTMLElement) => DOMConversion | null) | undefined,
		$import: (node: AttributesCarrier, element: HTMLElement) => void
	) =>
	(domNode: HTMLElement): DOMConversion | null => {
		const stock = stockConversion?.(domNode);
		if (!stock) {
			return null;
		}
		return {
			conversion: (element): DOMConversionOutput | null => {
				const output = stock.conversion(element);
				const node = output && !Array.isArray(output.node) ? output.node : null;
				if (carriesAttributes(node)) {
					$import(node.getWritable(), element);
				}
				return output;
			},
			priority: 1
		};
	};

/** Removes `property` from the inline style of `element` unless `style` declares it. */
function dropUnlessDeclared(
	element: HTMLElement,
	style: string | undefined,
	property: string
): void {
	const holder = document.createElement('span');
	holder.setAttribute('style', style ?? '');
	if (holder.style.getPropertyValue(property) === '') {
		element.style.removeProperty(property);
	}
}

/** Applies the preserved attributes of `node` on an exported element. */
function applyExportedAttributes(
	element: HTMLElement,
	attributes: PreservedAttributes,
	skippedStyles: string[] = []
): void {
	const { style, ...rest } = attributes;
	applyAttributes(element, rest);
	if (style) {
		mergeStyleDeclarations(element, style, skippedStyles);
	}
}

/** The `<table>` of a table node's DOM, which can be wrapped in a scrollable `<div>`. */
const findTableElement = (dom: HTMLElement): HTMLTableElement | null =>
	dom instanceof HTMLTableElement ? dom : dom.querySelector('table');

/** Same layout the `mails-lexical-table` theme class gives the table in the editor. */
const EDITOR_TABLE_EXPORT_STYLES: Record<string, string> = {
	'border-collapse': 'collapse',
	'table-layout': 'fixed',
	width: '100%'
};

export type SerializedExtendedTableCellNode = Spread<WithAttributes, SerializedTableCellNode>;
export type SerializedExtendedTableRowNode = Spread<WithAttributes, SerializedTableRowNode>;
export type SerializedExtendedTableNode = Spread<WithAttributes, SerializedTableNode>;

export class ExtendedTableCellNode extends TableCellNode {
	__attributes: PreservedAttributes = {};

	__imported = false;

	static override getType(): string {
		return 'extended-tablecell';
	}

	static override clone(node: ExtendedTableCellNode): ExtendedTableCellNode {
		return new ExtendedTableCellNode(node.__headerState, node.__colSpan, node.__width, node.__key);
	}

	override afterCloneFrom(prevNode: this): void {
		super.afterCloneFrom(prevNode);
		copyAttributes(this, prevNode);
	}

	static override importDOM(): DOMConversionMap | null {
		const stock = TableCellNode.importDOM();
		return {
			td: wrapConversion(stock?.td, $importTablePart),
			th: wrapConversion(stock?.th, $importTablePart)
		};
	}

	static override importJSON(
		serializedNode: SerializedExtendedTableCellNode
	): ExtendedTableCellNode {
		const node = new ExtendedTableCellNode().updateFromJSON(serializedNode);
		node.__attributes = serializedNode.attributes ?? {};
		node.__imported = serializedNode.imported ?? false;
		return node;
	}

	override exportJSON(): SerializedExtendedTableCellNode {
		return {
			...super.exportJSON(),
			type: ExtendedTableCellNode.getType(),
			attributes: this.__attributes,
			imported: this.__imported,
			version: 1
		};
	}

	override createDOM(config: EditorConfig): HTMLTableCellElement {
		const element = super.createDOM(config);
		// The width of the cell is owned by the node (the column resizer edits it).
		applyEditorViewAttributes(element, this.__attributes, TABLE_EDITOR_VIEW_ATTRIBUTES, ['width']);
		return element;
	}

	override updateDOM(prevNode: this): boolean {
		return (
			super.updateDOM(prevNode) || !areAttributesEqual(prevNode.__attributes, this.__attributes)
		);
	}

	override exportDOM(editor: LexicalEditor): DOMExportOutput {
		const output = super.exportDOM(editor);
		const { element } = output;
		if (element instanceof HTMLElement && this.__imported) {
			const { style } = this.__attributes;
			// What the stock export forces on every cell only makes sense for tables
			// created in the editor; an imported cell keeps what its author declared.
			dropUnlessDeclared(element, style, 'border');
			dropUnlessDeclared(element, style, 'text-align');
			// Author-declared alignment and size apply unless the user changed them in
			// the editor, in which case the node's own value (already exported by the
			// stock implementation) wins over the original declaration.
			const skippedStyles: string[] = [];
			if (this.getWidth()) {
				skippedStyles.push('width');
			} else {
				dropUnlessDeclared(element, style, 'width');
			}
			if (this.getVerticalAlign()) {
				skippedStyles.push('vertical-align');
			} else {
				dropUnlessDeclared(element, style, 'vertical-align');
			}
			if (this.getBackgroundColor()) {
				skippedStyles.push('background-color');
			}
			applyExportedAttributes(element, this.__attributes, skippedStyles);
		}
		return output;
	}
}

export class ExtendedTableRowNode extends TableRowNode {
	__attributes: PreservedAttributes = {};

	__imported = false;

	static override getType(): string {
		return 'extended-tablerow';
	}

	static override clone(node: ExtendedTableRowNode): ExtendedTableRowNode {
		return new ExtendedTableRowNode(node.__height, node.__key);
	}

	override afterCloneFrom(prevNode: this): void {
		super.afterCloneFrom(prevNode);
		copyAttributes(this, prevNode);
	}

	static override importDOM(): DOMConversionMap | null {
		return { tr: wrapConversion(TableRowNode.importDOM()?.tr, $importTablePart) };
	}

	static override importJSON(serializedNode: SerializedExtendedTableRowNode): ExtendedTableRowNode {
		const node = new ExtendedTableRowNode().updateFromJSON(serializedNode);
		node.__attributes = serializedNode.attributes ?? {};
		node.__imported = serializedNode.imported ?? false;
		return node;
	}

	override exportJSON(): SerializedExtendedTableRowNode {
		return {
			...super.exportJSON(),
			type: ExtendedTableRowNode.getType(),
			attributes: this.__attributes,
			imported: this.__imported,
			version: 1
		};
	}

	override createDOM(config: EditorConfig): HTMLElement {
		const element = super.createDOM(config);
		applyEditorViewAttributes(element, this.__attributes, TABLE_EDITOR_VIEW_ATTRIBUTES, ['height']);
		return element;
	}

	override updateDOM(prevNode: this): boolean {
		return (
			super.updateDOM(prevNode) || !areAttributesEqual(prevNode.__attributes, this.__attributes)
		);
	}

	override exportDOM(editor: LexicalEditor): DOMExportOutput {
		const output = super.exportDOM(editor);
		const { element } = output;
		if (element instanceof HTMLElement && this.__imported) {
			applyExportedAttributes(element, this.__attributes, this.getHeight() ? ['height'] : []);
		}
		return output;
	}
}

export class ExtendedTableNode extends TableNode {
	__attributes: PreservedAttributes = {};

	__imported = false;

	static override getType(): string {
		return 'extended-table';
	}

	static override clone(node: ExtendedTableNode): ExtendedTableNode {
		return new ExtendedTableNode(node.__key);
	}

	override afterCloneFrom(prevNode: this): void {
		super.afterCloneFrom(prevNode);
		copyAttributes(this, prevNode);
	}

	static override importDOM(): DOMConversionMap | null {
		return { table: wrapConversion(TableNode.importDOM()?.table, $importTable) };
	}

	static override importJSON(serializedNode: SerializedExtendedTableNode): ExtendedTableNode {
		const node = new ExtendedTableNode().updateFromJSON(serializedNode);
		node.__attributes = serializedNode.attributes ?? {};
		node.__imported = serializedNode.imported ?? false;
		return node;
	}

	override exportJSON(): SerializedExtendedTableNode {
		return {
			...super.exportJSON(),
			type: ExtendedTableNode.getType(),
			attributes: this.__attributes,
			imported: this.__imported,
			version: 1
		};
	}

	override createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
		const dom = super.createDOM(config, editor);
		const table = findTableElement(dom);
		if (table) {
			if (this.__imported) {
				// The theme class gives tables created here the editor look (full width,
				// fixed layout, bordered and padded cells). Its rules would override the
				// size and look an imported table declares (`width="480"`, `cellpadding`,
				// `border="0"`, ...), so the table is shown the way its author made it.
				removeClassNamesFromElement(table, config.theme.table);
				if (table.classList.length === 0) {
					table.removeAttribute('class');
				}
			}
			this.applyImportedViewAttributes(table);
		}
		return dom;
	}

	override updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
		if (
			super.updateDOM(prevNode, dom, config) ||
			!areAttributesEqual(prevNode.__attributes, this.__attributes)
		) {
			return true;
		}
		const table = prevNode.__style === this.__style ? null : findTableElement(dom);
		if (table) {
			// The stock update removes the declarations the node no longer has (e.g. the
			// width pinned by the resizer, after an undo), which the imported element
			// may declare as well: restore them.
			this.applyImportedViewAttributes(table);
		}
		return false;
	}

	/**
	 * Style properties the node declares itself (the column resizer pins `width`
	 * and `table-layout`), which win over the ones carried from the imported element.
	 */
	private getOwnedStyles(): string[] {
		return getDeclaredStyleProperties(this.__style);
	}

	private applyImportedViewAttributes(table: HTMLTableElement): void {
		applyEditorViewAttributes(
			table,
			this.__attributes,
			TABLE_EDITOR_VIEW_ATTRIBUTES,
			this.getOwnedStyles()
		);
	}

	override exportDOM(editor: LexicalEditor): DOMExportOutput {
		const output = super.exportDOM(editor);
		const stockAfter = output.after;
		const ownedStyles = this.getOwnedStyles();
		return {
			...output,
			after: (generatedElement): ReturnType<NonNullable<DOMExportOutput['after']>> => {
				const result = stockAfter ? stockAfter(generatedElement) : generatedElement;
				if (result instanceof HTMLTableElement) {
					if (this.__imported) {
						// The theme class is an editor concern; the original class replaces it.
						applyExportedAttributes(result, this.__attributes, ownedStyles);
						if (ownedStyles.includes('width')) {
							// The width the user gave the table replaces the original one, so the
							// message does not carry two conflicting widths.
							result.removeAttribute('width');
						}
					} else {
						// The layout of a table created in the editor comes from the theme class,
						// which the displayer doesn't have: inline it or the table collapses.
						Object.entries(EDITOR_TABLE_EXPORT_STYLES)
							.filter(([property]) => !ownedStyles.includes(property))
							.forEach(([property, value]) => result.style.setProperty(property, value));
					}
				}
				return result;
			}
		};
	}
}

export const TABLE_NODES: Array<Klass<LexicalNode> | LexicalNodeReplacement> = [
	TableNode,
	TableRowNode,
	TableCellNode,
	ExtendedTableNode,
	{
		replace: TableNode,
		with: () => new ExtendedTableNode(),
		withKlass: ExtendedTableNode
	},
	ExtendedTableRowNode,
	{
		replace: TableRowNode,
		with: (node: TableRowNode) => new ExtendedTableRowNode(node.__height),
		withKlass: ExtendedTableRowNode
	},
	ExtendedTableCellNode,
	{
		replace: TableCellNode,
		with: (node: TableCellNode) =>
			new ExtendedTableCellNode(node.__headerState, node.__colSpan, node.__width),
		withKlass: ExtendedTableCellNode
	}
];
