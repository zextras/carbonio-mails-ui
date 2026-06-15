/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Extension } from '@tiptap/core';

export type ListStyleOptions = {
	types: Array<string>;
};

/**
 * Adds a `list-style-type` attribute to bullet and ordered lists so the toolbar
 * can offer the marker-style choices (disc/circle/square, decimal/alpha/roman)
 * exposed by the legacy TinyMCE list split-buttons. The value is rendered as an
 * inline style so it serializes into the outgoing HTML.
 */
export const ListStyle = Extension.create<ListStyleOptions>({
	name: 'listStyle',
	addOptions() {
		return {
			types: ['bulletList', 'orderedList']
		};
	},
	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					listStyleType: {
						default: null,
						parseHTML: (element): string | null => element.style.listStyleType || null,
						renderHTML: (attributes): Record<string, string> =>
							attributes.listStyleType
								? { style: `list-style-type: ${attributes.listStyleType}` }
								: {}
					}
				}
			}
		];
	}
});
