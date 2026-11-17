/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, waitFor } from '@testing-library/react';

import {
	CID_URL,
	DOWNLOAD_SERVICE_URL,
	MESSAGE_ID,
	mockInlineImageUpload,
	PART_NAME,
	PREVIEW_SRC,
	saveInlineAttachment,
	stubObjectUrls
} from './inline-image-upload-test-utils';
import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const EDITOR_TESTID = 'edit-view-editor';
const FILE_INPUT_TESTID = 'inline-image-file-input';

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

function renderEditor(): { editorId: string; user: ReturnType<typeof setupTest>['user'] } {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: '', richText: '<p></p>' };
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return { editorId: editor.id, user };
}

describe('Inline image upload from the toolbar', () => {
	let restoreObjectUrls: () => void;
	beforeEach(() => {
		restoreObjectUrls = stubObjectUrls();
	});

	afterEach(() => {
		restoreObjectUrls();
		vi.restoreAllMocks();
	});

	it('previews the picked image immediately, without waiting for the draft save', async () => {
		const file = new File(['x'], 'pic.png', { type: 'image/png' });
		const { addInlineAttachments } = mockInlineImageUpload();
		const { user } = renderEditor();

		await user.upload(screen.getByTestId(FILE_INPUT_TESTID), file);

		expect(addInlineAttachments).toHaveBeenCalledWith([file], expect.anything());
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		const image = await within(editorElement).findByRole('img');
		expect(image).toHaveAttribute('src', PREVIEW_SRC);
	});

	it('keeps the cid reference in the saved html while the image is still pending', async () => {
		const file = new File(['x'], 'pic.png', { type: 'image/png' });
		mockInlineImageUpload();
		const { editorId, user } = renderEditor();

		await user.upload(screen.getByTestId(FILE_INPUT_TESTID), file);
		await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');

		// The cid is what keeps the inline attachment alive and what the outgoing
		// message refers to, even before the image has been saved.
		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(`data-pnsrc="${CID_URL}"`);
		});
	});

	it('replaces the preview with the download url in the editor and in the store', async () => {
		const file = new File(['x'], 'pic.png', { type: 'image/png' });
		mockInlineImageUpload();
		const { editorId, user } = renderEditor();

		await user.upload(screen.getByTestId(FILE_INPUT_TESTID), file);
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByRole('img');

		act(() => {
			saveInlineAttachment(editorId);
		});

		await waitFor(() => {
			expect(within(editorElement).getByRole('img')).toHaveAttribute('src', DOWNLOAD_SERVICE_URL);
		});
		// The store holds the serialized html, where the url query separators are
		// html-escaped.
		const escapedDownloadUrl = DOWNLOAD_SERVICE_URL.replace(/&/g, '&amp;');
		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(escapedDownloadUrl);
		});
		expect(richTextOf(editorId)).not.toContain(PREVIEW_SRC);
	});

	it('shows the new image, not the removed one, when an image of the draft is replaced', async () => {
		mockInlineImageUpload();
		const { editorId, user } = renderEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		await user.upload(
			screen.getByTestId(FILE_INPUT_TESTID),
			new File(['a'], 'first.png', { type: 'image/png' })
		);
		await within(editorElement).findByRole('img');
		act(() => {
			saveInlineAttachment(editorId);
		});
		await waitFor(() => {
			expect(within(editorElement).getByRole('img')).not.toHaveAttribute('src', PREVIEW_SRC);
		});
		const removedImageSrc = within(editorElement).getByRole('img').getAttribute('src');

		await user.click(within(editorElement).getByRole('img'));
		await user.keyboard('{Delete}');
		await waitFor(() => {
			expect(within(editorElement).queryByRole('img')).not.toBeInTheDocument();
		});

		await user.upload(
			screen.getByTestId(FILE_INPUT_TESTID),
			new File(['b'], 'second.png', { type: 'image/png' })
		);
		await within(editorElement).findByRole('img');
		// The draft keeps its id and the new image takes the part of the removed one.
		act(() => {
			saveInlineAttachment(editorId, 'upload-2@carbonio');
		});

		await waitFor(() => {
			expect(within(editorElement).getByRole('img')).not.toHaveAttribute('src', PREVIEW_SRC);
		});
		// The browser would show the removed image again if the url were the same.
		const newImage = within(editorElement).getByRole('img');
		expect(newImage).not.toHaveAttribute('src', removedImageSrc);
		expect(newImage).toHaveAttribute(
			'src',
			`/service/home/~/?auth=co&id=${MESSAGE_ID}&ci=upload-2%40carbonio&part=${PART_NAME}`
		);
	});

	it('inserts one image per picked file', async () => {
		const files = [
			new File(['x'], 'first.png', { type: 'image/png' }),
			new File(['y'], 'second.png', { type: 'image/png' })
		];
		mockInlineImageUpload();
		const { user } = renderEditor();

		await user.upload(screen.getByTestId(FILE_INPUT_TESTID), files);

		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await waitFor(() => {
			expect(within(editorElement).getAllByRole('img')).toHaveLength(2);
		});
	});

	it('removes the picked image when its upload fails', async () => {
		const file = new File(['x'], 'pic.png', { type: 'image/png' });
		const { failUpload } = mockInlineImageUpload();
		const { user } = renderEditor();

		await user.upload(screen.getByTestId(FILE_INPUT_TESTID), file);
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByRole('img');

		act(() => {
			failUpload();
		});

		await waitFor(() => {
			expect(within(editorElement).queryByRole('img')).not.toBeInTheDocument();
		});
		expect(URL.revokeObjectURL).toHaveBeenCalledWith(PREVIEW_SRC);
	});
});
