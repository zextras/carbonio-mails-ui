/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable max-classes-per-file -- two minimal Event stubs cover a jsdom gap (see below) */
import React from 'react';

import { act, fireEvent, waitFor } from '@testing-library/react';
import { CONTROLLED_TEXT_INSERTION_COMMAND, type LexicalEditor } from 'lexical';
import type { Mock } from 'vitest';

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
/** The url of an image of a message other than the one being written. */
const FOREIGN_URL = '/service/home/~/?auth=co&id=99&ci=foreign%40carbonio&part=2';
/** The bare url of the same part, the one it is downloaded from. */
const FOREIGN_PART_URL = '/service/home/~/?auth=co&id=99&part=2';
const HTML = 'text/html';

// jsdom implements neither DragEvent nor ClipboardEvent, yet Lexical's default
// paste handler checks the event against both: two no-op Event subclasses stand
// in so that the synthetic paste event is handled as a clipboard paste.
class StubDragEvent extends Event {}
class StubClipboardEvent extends Event {}

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

function setupEditorWith(richText: string, savedAttachments: Array<SavedAttachment> = []): string {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: '', richText };
	editor.savedAttachments = savedAttachments;
	setupEditorStore({ editors: [editor] });
	setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return editor.id;
}

/** Renders an editor with some text and no image, ready to paste into. */
async function setupEmptyEditor(savedAttachments: Array<SavedAttachment> = []): Promise<string> {
	const editorId = setupEditorWith('<p>Hello</p>', savedAttachments);
	await within(screen.getByTestId(EDITOR_TESTID)).findByText('Hello');
	return editorId;
}

function htmlDataTransfer(html: string): Pick<DataTransfer, 'getData' | 'types'> {
	return { getData: (type: string): string => (type === HTML ? html : ''), types: [HTML] };
}

/**
 * Dispatches a synthetic paste event carrying HTML, as when an image is copied
 * from a message being read.
 */
function pasteHtml(html: string): void {
	// eslint-disable-next-line testing-library/prefer-user-event
	fireEvent.paste(screen.getByTestId(EDITOR_TESTID), {
		clipboardData: { items: [], files: [], ...htmlDataTransfer(html) }
	});
}

/**
 * Inserts HTML the way Lexical does for a drop coming from outside the editor:
 * the browser's `insertFromDrop` input turns into a controlled text insertion.
 * jsdom lacks the input events Lexical listens to, so the command is
 * dispatched directly, within a single update as Lexical's `beforeinput`
 * handler does.
 */
function dropHtml(html: string): void {
	const editor = (
		screen.getByTestId(EDITOR_TESTID) as unknown as { __lexicalEditor: LexicalEditor }
	).__lexicalEditor;
	const event = new InputEvent('beforeinput', { inputType: 'insertFromDrop' });
	Object.defineProperty(event, 'dataTransfer', { value: htmlDataTransfer(html) });
	act(() => {
		editor.update(() => {
			editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, event);
		});
	});
}

function imageResponse(ok: boolean): Pick<Response, 'ok' | 'blob'> {
	return { ok, blob: async () => new Blob(['x'], { type: 'image/png' }) };
}

/** Stubs the download of the image the paste refers to. */
function mockFetchImage({ ok = true }: { ok?: boolean } = {}): Mock {
	const fetchMock = vi.fn().mockResolvedValue(imageResponse(ok));
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

/** Stubs a download of the image which completes only on demand. */
function mockPendingFetchImage(): { fetchMock: Mock; completeDownload: () => void } {
	let complete = (): void => undefined;
	const fetchMock = vi.fn(
		() =>
			new Promise((resolve) => {
				complete = (): void => resolve(imageResponse(true));
			})
	);
	vi.stubGlobal('fetch', fetchMock);
	return { fetchMock, completeDownload: (): void => complete() };
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
		vi.unstubAllGlobals();
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
		const fetchMock = mockFetchImage();

		const editorId = setupEditorWith(
			`<p><img src="${DOWNLOAD_URL}" data-pnsrc="cid:${CONTENT_ID}" alt="Inline attachment" /></p>`,
			[savedInlineAttachment(CONTENT_ID)]
		);
		const image = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');

		act(() => {
			useEditorsStore.getState().setIsDirty(editorId, true);
		});

		expect(image).toHaveAttribute('src', DOWNLOAD_URL);
		await waitFor(() => {
			expect(addInlineAttachments).not.toHaveBeenCalled();
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	describe('image copied from another message', () => {
		const globalScope = globalThis as Record<string, unknown>;
		const originalDragEvent = globalScope.DragEvent;
		const originalClipboardEvent = globalScope.ClipboardEvent;
		beforeAll(() => {
			globalScope.DragEvent = originalDragEvent ?? StubDragEvent;
			globalScope.ClipboardEvent = originalClipboardEvent ?? StubClipboardEvent;
		});
		afterAll(() => {
			globalScope.DragEvent = originalDragEvent;
			globalScope.ClipboardEvent = originalClipboardEvent;
		});

		it('downloads a pasted image and uploads it as a new inline attachment', async () => {
			const addInlineAttachments = vi.fn(() => [
				unsavedInlineAttachment(CONTENT_ID)
			]) as unknown as AddInlineAttachments;
			mockEditorAttachments(addInlineAttachments);
			const fetchMock = mockFetchImage();
			await setupEmptyEditor();

			pasteHtml(`<img src="${FOREIGN_URL}" alt="Pasted" />`);

			await waitFor(() => {
				expect(addInlineAttachments).toHaveBeenCalledTimes(1);
			});
			// Downloaded through the bare url of the part, whatever else the src carried.
			expect(fetchMock).toHaveBeenCalledWith(FOREIGN_PART_URL, expect.anything());
			expect(addInlineAttachments).toHaveBeenCalledWith(
				[expect.objectContaining({ type: 'image/png' })],
				expect.objectContaining({ saveImmediately: true })
			);
		});

		it('downloads an image dropped from another message', async () => {
			const addInlineAttachments = vi.fn(() => [
				unsavedInlineAttachment(CONTENT_ID)
			]) as unknown as AddInlineAttachments;
			mockEditorAttachments(addInlineAttachments);
			const fetchMock = mockFetchImage();
			await setupEmptyEditor();

			dropHtml(`<img src="${FOREIGN_URL}" alt="Dropped" />`);

			await waitFor(() => {
				expect(addInlineAttachments).toHaveBeenCalledTimes(1);
			});
			expect(fetchMock).toHaveBeenCalledWith(FOREIGN_PART_URL, expect.anything());
		});

		it('swaps both the url and the cid it carried with the ones of the new attachment', async () => {
			const addInlineAttachments = vi.fn(() => [
				unsavedInlineAttachment(CONTENT_ID)
			]) as unknown as AddInlineAttachments;
			mockEditorAttachments(addInlineAttachments);
			mockFetchImage();
			const editorId = await setupEmptyEditor();

			// The cid is the one the image had in the message it was copied from.
			pasteHtml(`<img src="${FOREIGN_URL}" data-pnsrc="cid:foreign@carbonio" alt="Pasted" />`);
			const image = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');
			await waitFor(() => {
				expect(addInlineAttachments).toHaveBeenCalledTimes(1);
			});
			persistInlineAttachment(editorId, CONTENT_ID);

			await waitFor(() => {
				expect(image).toHaveAttribute('src', DOWNLOAD_URL);
			});
			await waitFor(() => {
				const { richText } = useEditorsStore.getState().editors[editorId].text;
				expect(richText).toContain(`data-pnsrc="cid:${CONTENT_ID}"`);
			});
			expect(useEditorsStore.getState().editors[editorId].text.richText).not.toContain(
				'cid:foreign@carbonio'
			);
		});

		it('makes the send wait for the download and the upload', async () => {
			const addInlineAttachments = vi.fn(() => [
				unsavedInlineAttachment(CONTENT_ID)
			]) as unknown as AddInlineAttachments;
			mockEditorAttachments(addInlineAttachments);
			const { fetchMock, completeDownload } = mockPendingFetchImage();
			const editorId = await setupEmptyEditor();

			pasteHtml(`<img src="${FOREIGN_URL}" alt="Pasted" />`);
			const image = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');
			await waitFor(() => {
				expect(fetchMock).toHaveBeenCalledTimes(1);
			});

			let converted = false;
			act(() => {
				ensureInlineImagesConverted(editorId).then(() => {
					converted = true;
				});
			});
			completeDownload();
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

		it('does not upload anything when the download fails', async () => {
			const addInlineAttachments = vi.fn() as unknown as AddInlineAttachments;
			mockEditorAttachments(addInlineAttachments);
			const fetchMock = mockFetchImage({ ok: false });
			await setupEmptyEditor();

			pasteHtml(`<img src="${FOREIGN_URL}" alt="Pasted" />`);

			await waitFor(() => {
				expect(fetchMock).toHaveBeenCalledTimes(1);
			});
			expect(addInlineAttachments).not.toHaveBeenCalled();
		});

		it('downloads it only once however many times the editor changes', async () => {
			const addInlineAttachments = vi.fn(() => [
				unsavedInlineAttachment(CONTENT_ID)
			]) as unknown as AddInlineAttachments;
			mockEditorAttachments(addInlineAttachments);
			const fetchMock = mockFetchImage();
			const editorId = await setupEmptyEditor();

			pasteHtml(`<img src="${FOREIGN_URL}" alt="Pasted" />`);
			await waitFor(() => {
				expect(addInlineAttachments).toHaveBeenCalledTimes(1);
			});
			act(() => {
				useEditorsStore.getState().setIsDirty(editorId, false);
			});
			act(() => {
				useEditorsStore.getState().setIsDirty(editorId, true);
			});

			expect(fetchMock).toHaveBeenCalledTimes(1);
		});

		it('never downloads the images of the content loaded in the editor, such as the quoted message of a reply', async () => {
			const addInlineAttachments = vi.fn() as unknown as AddInlineAttachments;
			mockEditorAttachments(addInlineAttachments);
			const fetchMock = mockFetchImage();

			// Written by the sender of the message being replied to, who could
			// point it at any part of the user's mailbox.
			const editorId = setupEditorWith(
				`<p>quoted</p><p><img src="${FOREIGN_URL}" width="1" height="1" alt="tracker" /></p>`
			);
			await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');

			act(() => {
				useEditorsStore.getState().setIsDirty(editorId, true);
			});
			await act(() => ensureInlineImagesConverted(editorId));

			expect(fetchMock).not.toHaveBeenCalled();
			expect(addInlineAttachments).not.toHaveBeenCalled();
		});

		it.each([
			['served by another host', 'https://attacker.example/service/home/~/?auth=co&id=99&part=2'],
			[
				'of another account',
				'/service/home/someone@example.com/?auth=co&id=99&part=2&x=/service/home/~/?'
			],
			['without a part', '/service/home/~/?auth=co&id=99']
		])('does not download a pasted image %s', async (_, src) => {
			const addInlineAttachments = vi.fn() as unknown as AddInlineAttachments;
			mockEditorAttachments(addInlineAttachments);
			const fetchMock = mockFetchImage();
			const editorId = await setupEmptyEditor();

			pasteHtml(`<img src="${src}" alt="Pasted" />`);
			await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');
			await act(() => ensureInlineImagesConverted(editorId));

			expect(fetchMock).not.toHaveBeenCalled();
			expect(addInlineAttachments).not.toHaveBeenCalled();
		});

		it('does not upload again a pasted image of this message attached without an inline disposition', async () => {
			const addInlineAttachments = vi.fn() as unknown as AddInlineAttachments;
			mockEditorAttachments(addInlineAttachments);
			const fetchMock = mockFetchImage();
			// e.g. the image of a forwarded message, referred by its content id
			// although its part is not marked as inline.
			const editorId = await setupEmptyEditor([
				{ ...savedInlineAttachment(CONTENT_ID), isInline: false }
			]);

			pasteHtml(`<img src="${DOWNLOAD_URL}" data-pnsrc="cid:${CONTENT_ID}" alt="Pasted" />`);
			await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');
			await act(() => ensureInlineImagesConverted(editorId));

			expect(fetchMock).not.toHaveBeenCalled();
			expect(addInlineAttachments).not.toHaveBeenCalled();
		});
	});
});
