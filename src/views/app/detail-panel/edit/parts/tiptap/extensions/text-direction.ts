/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Extension } from '@tiptap/core';

export type TextDirectionValue = 'ltr' | 'rtl';

export type TextDirectionOptions = {
	types: Array<string>;
	directions: Array<TextDirectionValue>;
};

declare module '@tiptap/core' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface Commands<ReturnType> {
		textDirection: {
			setTextDirection: (direction: TextDirectionValue) => ReturnType;
			unsetTextDirection: () => ReturnType;
		};
	}
}

/**
 * Per-block text direction (LTR / RTL) for paragraphs and headings, mirroring
 * TinyMCE's `ltr` / `rtl` buttons. The value is stored on the `dir` attribute so
 * it serializes straight into the outgoing HTML.
 */
export const TextDirection = Extension.create<TextDirectionOptions>({
	name: 'textDirection',
	addOptions() {
		return {
			types: ['paragraph', 'heading'],
			directions: ['ltr', 'rtl']
		};
	},
	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					dir: {
						default: null,
						parseHTML: (element): string | null => element.getAttribute('dir'),
						renderHTML: (attributes): Record<string, string> =>
							attributes.dir ? { dir: String(attributes.dir) } : {}
					}
				}
			}
		];
	},
	addCommands() {
		const { types } = this.options;
		return {
			setTextDirection:
				(direction) =>
				({ commands }): boolean =>
					types.every((type) => commands.updateAttributes(type, { dir: direction })),
			unsetTextDirection:
				() =>
				({ commands }): boolean =>
					types.every((type) => commands.resetAttributes(type, 'dir'))
		};
	}
});
