/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AnyExtension } from '@tiptap/core';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color, FontFamily, TextStyle } from '@tiptap/extension-text-style';
import { StarterKit } from '@tiptap/starter-kit';

import { FontSize } from './font-size';
import { InlineImage } from './inline-image';
import { SignatureBlock } from './signature-block';

/**
 * Builds the ordered list of extensions used by the mail compose editor.
 *
 * `StarterKit` already provides the core nodes/marks (paragraph, headings,
 * bold/italic/strike, code, code block, blockquote, lists, horizontal rule,
 * hard break, history, underline and link), so only the extras required for
 * mail parity are added here.
 */
export const buildEditorExtensions = (): Array<AnyExtension> => [
	StarterKit.configure({
		link: {
			openOnClick: false,
			autolink: true,
			HTMLAttributes: { rel: 'noopener noreferrer' }
		}
	}),
	SignatureBlock,
	TextStyle,
	Color,
	FontFamily,
	FontSize,
	Highlight.configure({ multicolor: true }),
	TextAlign.configure({ types: ['heading', 'paragraph'] }),
	InlineImage.configure({ inline: true, allowBase64: true }),
	Table.configure({ resizable: true }),
	TableRow,
	TableHeader,
	TableCell
];
