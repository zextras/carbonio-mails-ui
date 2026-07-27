/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, waitFor } from '@testing-library/react';
import { $setSelection, type LexicalEditor } from 'lexical';

import {
	ALIGN_CENTER_LABEL,
	EDITOR_TESTID,
	installRangeRectPolyfill,
	LTR_LABEL,
	richTextOf,
	RTL_LABEL,
	SELECTED_TEXT,
	setupWithSelectedContent
} from './rich-toolbar-plugin-test-utils';
import { screen } from '@test-setup';

beforeAll(() => {
	installRangeRectPolyfill();
});

describe('RichToolbarPlugin - paragraph alignment', () => {
	it('aligns the paragraph to the center', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: ALIGN_CENTER_LABEL }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('text-align: center');
		});
	});

	it('aligns the paragraph to the right', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: 'lexical-label.align_right' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('text-align: right');
		});
	});
});

describe('RichToolbarPlugin - text direction', () => {
	it('sets the selected paragraph direction to rtl and marks the rtl option active', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: RTL_LABEL }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('dir="rtl"');
		});
		expect(
			await screen.findByRole('button', { name: RTL_LABEL, pressed: true })
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: LTR_LABEL, pressed: false })).toBeInTheDocument();
	});

	it('restores the ltr direction on a paragraph previously set to rtl', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: RTL_LABEL }));
		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('dir="rtl"');
		});

		await user.click(screen.getByRole('button', { name: LTR_LABEL }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('dir="ltr"');
		});
		expect(richTextOf(editorId)).not.toContain('dir="rtl"');
	});

	it('applies the direction to every top-level element in the selection', async () => {
		const { editorId, user } = await setupWithSelectedContent(
			`<p>${SELECTED_TEXT}</p><p>second paragraph</p>`
		);

		await user.click(screen.getByRole('button', { name: RTL_LABEL }));

		await waitFor(() => {
			expect(richTextOf(editorId).match(/dir="rtl"/g)).toHaveLength(2);
		});
	});

	it('does nothing when there is no selection in the editor', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		// Clear the selection through the editor instance that Lexical exposes
		// on the contentEditable root element.
		const editorElement = screen.getByTestId(EDITOR_TESTID) as HTMLElement & {
			__lexicalEditor: LexicalEditor;
		};
		act(() => {
			editorElement.__lexicalEditor.update(() => {
				$setSelection(null);
			});
		});

		await user.click(screen.getByRole('button', { name: RTL_LABEL }));

		expect(richTextOf(editorId)).not.toContain('dir="rtl"');
	});
});
