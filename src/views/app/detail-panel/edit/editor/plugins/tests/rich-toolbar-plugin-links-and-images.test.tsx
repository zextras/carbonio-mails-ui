/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, waitFor } from '@testing-library/react';

import {
	EDITOR_TESTID,
	installRangeRectPolyfill,
	LINK_LABEL,
	richTextOf,
	SELECTED_TEXT,
	setupEditor,
	setupWithSelectedContent
} from './rich-toolbar-plugin-test-utils';
import { screen, within } from '@test-setup';

beforeAll(() => {
	installRangeRectPolyfill();
});

describe('RichToolbarPlugin - links and images', () => {
	it('inserts a link from the modal for the typed URL', async () => {
		const { editorId, editorElement, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: LINK_LABEL }));

		expect(await screen.findByText('lexical-label.insert_edit_link')).toBeInTheDocument();
		await user.pasteInto(
			screen.getByRole('textbox', { name: 'lexical-label.url' }),
			'https://example.com'
		);
		await user.click(screen.getByRole('button', { name: 'label.save' }));

		expect(await within(editorElement).findByRole('link')).toBeInTheDocument();
		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('href="https://example.com"');
		});
	});

	it('pre-fills the text to display with the current selection', async () => {
		const { user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: LINK_LABEL }));

		expect(
			await screen.findByRole('textbox', { name: 'lexical-label.text_to_display' })
		).toHaveValue(SELECTED_TEXT);
	});

	it('opens the link in a new window when selected', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: LINK_LABEL }));
		await user.pasteInto(
			screen.getByRole('textbox', { name: 'lexical-label.url' }),
			'https://example.com'
		);

		await user.click(screen.getByText('lexical-label.current_window'));
		await user.click(
			within(screen.getByTestId('dropdown-popper-list')).getByText('lexical-label.new_window')
		);
		await user.click(screen.getByRole('button', { name: 'label.save' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('target="_blank"');
		});
	});

	it('keeps the link when the text of an auto-detected link is changed', async () => {
		const { editorId, user } = setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByText(SELECTED_TEXT);
		await user.click(editorElement);
		await user.keyboard(' https://example.com ');
		const linkText = within(await within(editorElement).findByRole('link')).getByText(
			'https://example.com'
		);
		act(() => {
			window.getSelection()?.setBaseAndExtent(linkText, 0, linkText, 0);
			document.dispatchEvent(new Event('selectionchange'));
		});

		await user.click(screen.getByRole('button', { name: LINK_LABEL }));
		const textInput = await screen.findByRole('textbox', {
			name: 'lexical-label.text_to_display'
		});
		expect(textInput).toHaveValue('https://example.com');
		await user.clear(textInput);
		await user.type(textInput, 'Example');
		await user.click(screen.getByRole('button', { name: 'label.save' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toMatch(
				/<a [^>]*href="https:\/\/example\.com"[^>]*>.*Example.*<\/a>/
			);
		});
	});

	it('inserts an image from the URL entered in the modal', async () => {
		const { user } = setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await user.click(editorElement);

		await user.click(screen.getByRole('button', { name: 'lexical-label.insert_image_url' }));
		await user.pasteInto(
			screen.getByRole('textbox', { name: 'lexical-label.image_source' }),
			'https://example.com/picture.png'
		);
		await user.pasteInto(
			screen.getByRole('textbox', { name: 'lexical-label.image_alt' }),
			'a picture'
		);
		await user.click(screen.getByRole('button', { name: 'label.save' }));

		const image = await within(editorElement).findByRole('img');
		expect(image).toHaveAttribute('src', 'https://example.com/picture.png');
	});

	it('does not insert an image when the modal is dismissed', async () => {
		const { editorElement, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: 'lexical-label.insert_image_url' }));
		await user.click(screen.getByRole('button', { name: 'label.cancel' }));

		expect(within(editorElement).queryByRole('img')).not.toBeInTheDocument();
	});

	it('shows the image alignment control only while an image is selected', async () => {
		const { user } = setupEditor('<p><img src="https://example.com/inline.png" alt="pic" /></p>');
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		const image = await within(editorElement).findByRole('img');

		expect(
			screen.queryByRole('button', { name: 'lexical-label.image_align' })
		).not.toBeInTheDocument();

		await user.click(image);

		expect(
			await screen.findByRole('button', { name: 'lexical-label.image_align' })
		).toBeInTheDocument();
	});
});
