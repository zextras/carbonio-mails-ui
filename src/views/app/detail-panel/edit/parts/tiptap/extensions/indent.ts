/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Extension } from '@tiptap/core';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { EditorState, Transaction } from '@tiptap/pm/state';

export type IndentOptions = {
	types: Array<string>;
	step: number;
	maxLevel: number;
};

const INDENT_STEP_PX = 40;
const MAX_INDENT_LEVEL = 8;

declare module '@tiptap/core' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface Commands<ReturnType> {
		indent: {
			indent: () => ReturnType;
			outdent: () => ReturnType;
		};
	}
}

/**
 * Block indentation for paragraphs and headings, mirroring TinyMCE's
 * outdent/indent buttons. The level is stored as a `data-indent` attribute and
 * rendered as an inline `margin-left` so it survives serialization into the
 * outgoing email HTML.
 */
export const Indent = Extension.create<IndentOptions>({
	name: 'indent',
	addOptions() {
		return {
			types: ['paragraph', 'heading'],
			step: INDENT_STEP_PX,
			maxLevel: MAX_INDENT_LEVEL
		};
	},
	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					indent: {
						default: 0,
						parseHTML: (element): number => {
							const fromData = Number(element.getAttribute('data-indent'));
							if (!Number.isNaN(fromData) && fromData > 0) {
								return fromData;
							}
							const marginLeft = parseInt(element.style.marginLeft, 10);
							return Number.isNaN(marginLeft) ? 0 : Math.round(marginLeft / this.options.step);
						},
						renderHTML: (attributes): Record<string, string> => {
							const level = Number(attributes.indent) || 0;
							if (level <= 0) {
								return {};
							}
							return {
								'data-indent': String(level),
								style: `margin-left: ${level * this.options.step}px`
							};
						}
					}
				}
			}
		];
	},
	addCommands() {
		const { types, maxLevel } = this.options;
		const applyIndent =
			(direction: 1 | -1) =>
			({
				state,
				tr,
				dispatch
			}: {
				state: EditorState;
				tr: Transaction;
				dispatch?: (tr: Transaction) => void;
			}): boolean => {
				const { from, to } = state.selection;
				let changed = false;
				state.doc.nodesBetween(from, to, (node: ProseMirrorNode, pos: number) => {
					if (!types.includes(node.type.name)) {
						return;
					}
					const current = Number(node.attrs.indent) || 0;
					const next = Math.min(maxLevel, Math.max(0, current + direction));
					if (next !== current) {
						tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
						changed = true;
					}
				});
				if (changed && dispatch) {
					dispatch(tr);
				}
				return changed;
			};

		return {
			indent: (): ReturnType<typeof applyIndent> => applyIndent(1),
			outdent: (): ReturnType<typeof applyIndent> => applyIndent(-1)
		};
	}
});
