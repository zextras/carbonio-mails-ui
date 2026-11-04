/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { waitFor } from '@testing-library/react';

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

const URL_LABEL = 'lexical-label.url';
const EXAMPLE_URL = 'https://example.com';
const SAVE_LABEL = 'label.save';

describe('RichToolbarPlugin - links and images', () => {
	it('inserts a link from the modal for the typed URL', async () => {
		const { editorId, editorElement, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: LINK_LABEL }));

		expect(await screen.findByText('lexical-label.insert_edit_link')).toBeInTheDocument();
		await user.pasteInto(screen.getByRole('textbox', { name: URL_LABEL }), EXAMPLE_URL);
		await user.click(screen.getByRole('button', { name: SAVE_LABEL }));

		expect(await within(editorElement).findByRole('link')).toBeInTheDocument();
		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(`href="${EXAMPLE_URL}"`);
		});
	});

	it('pre-fills the text to display with the current selection', async () => {
		const { user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: LINK_LABEL }));

		expect(
			await screen.findByRole('textbox', { name: 'lexical-label.text_to_display' })
		).toHaveValue(SELECTED_TEXT);
	});

	it('opens a new link in a new window by default', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: LINK_LABEL }));
		await user.pasteInto(screen.getByRole('textbox', { name: URL_LABEL }), EXAMPLE_URL);

		expect(screen.getByText('lexical-label.new_window')).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: SAVE_LABEL }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('target="_blank"');
		});
	});

	it('opens the link in the current window when selected', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: LINK_LABEL }));
		await user.pasteInto(screen.getByRole('textbox', { name: URL_LABEL }), EXAMPLE_URL);

		await user.click(screen.getByText('lexical-label.new_window'));
		await user.click(
			within(screen.getByTestId('dropdown-popper-list')).getByText('lexical-label.current_window')
		);
		await user.click(screen.getByRole('button', { name: SAVE_LABEL }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(`href="${EXAMPLE_URL}"`);
		});
		expect(richTextOf(editorId)).not.toContain('target="_blank"');
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
		await user.click(screen.getByRole('button', { name: SAVE_LABEL }));

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
