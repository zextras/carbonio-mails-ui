/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, waitFor } from '@testing-library/react';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { TIMEOUTS } from 'constants/index';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import * as editorStoreIndex from 'store/editor/index';
import { useEditorsStore } from 'store/editor/store';
import { SavedAttachment, UnsavedAttachment } from 'types/attachments';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';
import { ensureInlineImagesConverted } from 'views/app/detail-panel/edit/editor/plugins/inline-image-conversion-registry';

const EDITOR_TESTID = 'edit-view-editor';
const MESSAGE_ID = '42';
const PART_NAME = '2';
const CONTENT_ID = 'inline-1@carbonio';
const DOWNLOAD_URL = `/service/home/~/?auth=co&id=${MESSAGE_ID}&part=${PART_NAME}`;

/** A 1x1 transparent PNG, as it would be embedded in a signature. */
const PNG_DATA_URI =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

type AddInlineAttachments = ReturnType<
	typeof editorStoreIndex.useEditorAttachments
>['addInlineAttachments'];

function unsavedInlineAttachment(contentId: string): UnsavedAttachment {
	return {
		filename: 'inline-image-1.png',
		contentType: 'image/png',
		size: 70,
		isInline: true,
		contentId,
		uploadId: contentId.replace('@carbonio', '')
	};
}

function savedInlineAttachment(contentId: string): SavedAttachment {
	return {
		messageId: MESSAGE_ID,
		partName: PART_NAME,
		filename: 'inline-image-1.png',
		contentType: 'image/png',
		size: 70,
		isInline: true,
		contentId
	};
}

/**
 * Replaces `useEditorAttachments` so the conversion's upload step resolves
 * synchronously, returning the unsaved attachments the real one would.
 */
function mockEditorAttachments(addInlineAttachments: AddInlineAttachments): void {
	vi.spyOn(editorStoreIndex, 'useEditorAttachments').mockReturnValue({
		addInlineAttachments,
		keepOnlyInlineAttachments: vi.fn(),
		addStandardAttachments: vi.fn(),
		addUploadedAttachment: vi.fn()
	} as unknown as ReturnType<typeof editorStoreIndex.useEditorAttachments>);
}

function setupEditorWith(richText: string): string {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: '', richText };
	setupEditorStore({ editors: [editor] });
	setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return editor.id;
}

/** Simulates the draft save persisting the uploaded inline attachment. */
function persistInlineAttachment(editorId: string, contentId: string): void {
	act(() => {
		useEditorsStore.getState().setSavedAttachments(editorId, [savedInlineAttachment(contentId)]);
	});
}

describe('InlineDataImageUploadPlugin', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('does not upload anything until the message is actually edited', async () => {
		const addInlineAttachments = vi.fn() as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		setupEditorWith(`<p><img src="${PNG_DATA_URI}" alt="Inline attachment" /></p>`);

		// The image is displayed, but opening a compose window must not create a
		// draft nor upload an attachment for a message the user has not written.
		const image = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');
		expect(image).toHaveAttribute('src', PNG_DATA_URI);
		await waitFor(() => {
			expect(addInlineAttachments).not.toHaveBeenCalled();
		});
	});

	it('uploads the data URI image once the editor becomes dirty', async () => {
		const addInlineAttachments = vi.fn(() => [
			unsavedInlineAttachment(CONTENT_ID)
		]) as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		const editorId = setupEditorWith(
			`<p><img src="${PNG_DATA_URI}" alt="Inline attachment" /></p>`
		);
		await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');

		act(() => {
			useEditorsStore.getState().setIsDirty(editorId, true);
		});

		await waitFor(() => {
			expect(addInlineAttachments).toHaveBeenCalledTimes(1);
		});
		// The draft has to be saved at once, otherwise the body keeps the data URI
		// until the auto-save interval elapses.
		expect(addInlineAttachments).toHaveBeenCalledWith(
			[expect.any(File)],
			expect.objectContaining({ saveImmediately: true })
		);
	});

	it('repoints the node once the draft save persists the attachment', async () => {
		const addInlineAttachments = vi.fn(() => [
			unsavedInlineAttachment(CONTENT_ID)
		]) as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		const editorId = setupEditorWith(
			`<p><img src="${PNG_DATA_URI}" alt="Inline attachment" /></p>`
		);
		const image = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');

		act(() => {
			useEditorsStore.getState().setIsDirty(editorId, true);
		});
		await waitFor(() => {
			expect(addInlineAttachments).toHaveBeenCalledTimes(1);
		});

		persistInlineAttachment(editorId, CONTENT_ID);

		await waitFor(() => {
			expect(image).toHaveAttribute('src', DOWNLOAD_URL);
		});
	});

	it('uploads every data URI image of the signature in a single batch', async () => {
		const addInlineAttachments = vi.fn(() => [
			unsavedInlineAttachment('inline-1@carbonio'),
			unsavedInlineAttachment('inline-2@carbonio')
		]) as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		const editorId = setupEditorWith(
			`<p><img src="${PNG_DATA_URI}" alt="one" /><img src="${PNG_DATA_URI}" alt="two" /></p>`
		);
		await within(screen.getByTestId(EDITOR_TESTID)).findAllByRole('img');

		act(() => {
			useEditorsStore.getState().setIsDirty(editorId, true);
		});

		// A single call: one upload batch means one draft save, so no completion
		// is lost to the save debounce.
		await waitFor(() => {
			expect(addInlineAttachments).toHaveBeenCalledTimes(1);
		});
		const [uploadedFiles] = vi.mocked(addInlineAttachments).mock.calls[0];
		expect(uploadedFiles).toHaveLength(2);
	});

	it('converts on demand for a message sent without being edited', async () => {
		const addInlineAttachments = vi.fn(() => [
			unsavedInlineAttachment(CONTENT_ID)
		]) as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		const editorId = setupEditorWith(
			`<p><img src="${PNG_DATA_URI}" alt="Inline attachment" /></p>`
		);
		const image = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');
		expect(addInlineAttachments).not.toHaveBeenCalled();

		// What the send handlers do before handing the message over.
		let converted = false;
		act(() => {
			ensureInlineImagesConverted(editorId).then(() => {
				converted = true;
			});
		});

		await waitFor(() => {
			expect(addInlineAttachments).toHaveBeenCalledTimes(1);
		});
		expect(converted).toBe(false);

		persistInlineAttachment(editorId, CONTENT_ID);

		await waitFor(() => {
			expect(converted).toBe(true);
		});
		expect(image).toHaveAttribute('src', DOWNLOAD_URL);
	});

	it('resolves the on demand conversion even if the attachment is never persisted', async () => {
		const addInlineAttachments = vi.fn(() => [
			unsavedInlineAttachment(CONTENT_ID)
		]) as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		const editorId = setupEditorWith(
			`<p><img src="${PNG_DATA_URI}" alt="Inline attachment" /></p>`
		);
		await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');

		// The draft save never completes: the send must still go through rather
		// than hang forever, even if it means the image travels as it is.
		let converted = false;
		act(() => {
			ensureInlineImagesConverted(editorId).then(() => {
				converted = true;
			});
		});
		await waitFor(() => {
			expect(addInlineAttachments).toHaveBeenCalledTimes(1);
		});
		expect(converted).toBe(false);

		act(() => {
			vi.advanceTimersByTime(TIMEOUTS.INLINE_IMAGES_CONVERSION);
		});

		await waitFor(() => {
			expect(converted).toBe(true);
		});
	});

	it('resolves the on demand conversion immediately when there is nothing to convert', async () => {
		const addInlineAttachments = vi.fn() as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		const editorId = setupEditorWith('<p>no images here</p>');
		await within(screen.getByTestId(EDITOR_TESTID)).findByText('no images here');

		await expect(ensureInlineImagesConverted(editorId)).resolves.toBeUndefined();
		expect(addInlineAttachments).not.toHaveBeenCalled();
	});

	it('does not attempt to upload a data URI which is not an image', async () => {
		const addInlineAttachments = vi.fn() as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		const editorId = setupEditorWith(
			'<p><img src="data:text/plain;base64,aGVsbG8=" alt="Inline attachment" /></p>'
		);
		await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');

		act(() => {
			useEditorsStore.getState().setIsDirty(editorId, true);
		});

		await waitFor(() => {
			expect(addInlineAttachments).not.toHaveBeenCalled();
		});
	});

	it('leaves an already uploaded inline image untouched', async () => {
		const addInlineAttachments = vi.fn() as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		const editorId = setupEditorWith(
			`<p><img src="${DOWNLOAD_URL}" data-pnsrc="cid:${CONTENT_ID}" alt="Inline attachment" /></p>`
		);
		const image = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');

		act(() => {
			useEditorsStore.getState().setIsDirty(editorId, true);
		});

		expect(image).toHaveAttribute('src', DOWNLOAD_URL);
		await waitFor(() => {
			expect(addInlineAttachments).not.toHaveBeenCalled();
		});
	});
});
