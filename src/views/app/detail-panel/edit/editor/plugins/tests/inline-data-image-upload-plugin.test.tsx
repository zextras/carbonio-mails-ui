/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { waitFor } from '@testing-library/react';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import * as editorStoreIndex from 'store/editor/index';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const EDITOR_TESTID = 'edit-view-editor';
const DOWNLOAD_URL = 'https://service/inline.png';
const CID_URL = 'cid:inline@carbonio';

/** A 1x1 transparent PNG, as it would be embedded in a signature. */
const PNG_DATA_URI =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

type AddInlineAttachments = ReturnType<
	typeof editorStoreIndex.useEditorAttachments
>['addInlineAttachments'];

/**
 * Replaces `useEditorAttachments` so the conversion's upload step resolves
 * synchronously with a ready-to-use inline attachment.
 */
function mockEditorAttachments(addInlineAttachments: AddInlineAttachments): void {
	vi.spyOn(editorStoreIndex, 'useEditorAttachments').mockReturnValue({
		addInlineAttachments,
		keepOnlyInlineAttachments: vi.fn(),
		addStandardAttachments: vi.fn(),
		addUploadedAttachment: vi.fn()
	} as unknown as ReturnType<typeof editorStoreIndex.useEditorAttachments>);
}

function renderEditorWith(richText: string): void {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: '', richText };
	setupEditorStore({ editors: [editor] });
	setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
}

describe('InlineDataImageUploadPlugin', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('uploads a data URI image as an inline attachment and repoints the node at it', async () => {
		const addInlineAttachments = vi.fn((_files, { onSaveComplete }) => {
			onSaveComplete([{ downloadServiceUrl: DOWNLOAD_URL, cidUrl: CID_URL }]);
		}) as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		renderEditorWith(`<p><img src="${PNG_DATA_URI}" alt="Inline attachment" /></p>`);

		await waitFor(() => {
			expect(addInlineAttachments).toHaveBeenCalledTimes(1);
		});

		// The data URI is decoded back into a real file, so it can be uploaded and
		// sent as a multipart/related part instead of base64 markup in the body.
		const [uploadedFiles] = vi.mocked(addInlineAttachments).mock.calls[0];
		expect(uploadedFiles).toHaveLength(1);
		expect(uploadedFiles[0]).toBeInstanceOf(File);
		expect(uploadedFiles[0].type).toBe('image/png');
		expect(uploadedFiles[0].size).toBeGreaterThan(0);

		const image = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');
		await waitFor(() => {
			expect(image).toHaveAttribute('src', DOWNLOAD_URL);
		});
	});

	it('converts each data URI image only once', async () => {
		const addInlineAttachments = vi.fn((_files, { onSaveComplete }) => {
			onSaveComplete([{ downloadServiceUrl: DOWNLOAD_URL, cidUrl: CID_URL }]);
		}) as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		renderEditorWith(`<p><img src="${PNG_DATA_URI}" alt="Inline attachment" /></p>`);

		const image = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');
		await waitFor(() => {
			expect(image).toHaveAttribute('src', DOWNLOAD_URL);
		});
		expect(addInlineAttachments).toHaveBeenCalledTimes(1);
	});

	it('leaves an already uploaded inline image untouched', async () => {
		const addInlineAttachments = vi.fn() as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		renderEditorWith(
			`<p><img src="${DOWNLOAD_URL}" data-pnsrc="${CID_URL}" alt="Inline attachment" /></p>`
		);

		const image = await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');
		expect(image).toHaveAttribute('src', DOWNLOAD_URL);
		await waitFor(() => {
			expect(addInlineAttachments).not.toHaveBeenCalled();
		});
	});

	it('does not attempt to upload a data URI which is not an image', async () => {
		const addInlineAttachments = vi.fn() as unknown as AddInlineAttachments;
		mockEditorAttachments(addInlineAttachments);

		renderEditorWith(
			'<p><img src="data:text/plain;base64,aGVsbG8=" alt="Inline attachment" /></p>'
		);

		await within(screen.getByTestId(EDITOR_TESTID)).findByRole('img');
		await waitFor(() => {
			expect(addInlineAttachments).not.toHaveBeenCalled();
		});
	});
});
