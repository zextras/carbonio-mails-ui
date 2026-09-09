/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as editorStoreIndex from 'store/editor/index';
import { useEditorsStore } from 'store/editor/store';
import { SavedAttachment, UnsavedAttachment } from 'types/attachments';

export const PREVIEW_SRC = 'blob:preview-src';
export const UPLOAD_ID = 'upload-1';
export const CONTENT_ID = `${UPLOAD_ID}@carbonio`;
export const CID_URL = `cid:${CONTENT_ID}`;
export const MESSAGE_ID = '123';
export const PART_NAME = '2';
export const DOWNLOAD_SERVICE_URL = `/service/home/~/?auth=co&id=${MESSAGE_ID}&part=${PART_NAME}`;

type AddInlineAttachments = ReturnType<
	typeof editorStoreIndex.useEditorAttachments
>['addInlineAttachments'];

type AddInlineAttachmentsOptions = NonNullable<Parameters<AddInlineAttachments>[1]>;

export type InlineImageUploadMock = {
	addInlineAttachments: AddInlineAttachments;
	/** Simulates the failure of the upload of the first file. */
	failUpload: () => void;
};

/**
 * jsdom implements neither `createObjectURL` nor `revokeObjectURL`: both are
 * stubbed so that the preview url of a pending inline image is predictable.
 * Returns the teardown to run in `afterEach`.
 */
export function stubObjectUrls(): () => void {
	const { createObjectURL, revokeObjectURL } = URL;
	URL.createObjectURL = vi.fn(() => PREVIEW_SRC);
	URL.revokeObjectURL = vi.fn();
	return (): void => {
		URL.createObjectURL = createObjectURL;
		URL.revokeObjectURL = revokeObjectURL;
	};
}

/**
 * Replaces `useEditorAttachments` with a fake whose upload never resolves on its
 * own, so that what the editor shows while the upload is still pending can be
 * asserted.
 */
export function mockInlineImageUpload(): InlineImageUploadMock {
	let uploadedFiles: Array<File> = [];
	let options: AddInlineAttachmentsOptions | undefined;

	const addInlineAttachments = vi.fn((files: Array<File>, uploadOptions) => {
		uploadedFiles = files;
		options = uploadOptions;
		return files.map<UnsavedAttachment>((file, index) => ({
			filename: file.name,
			contentType: file.type,
			size: file.size,
			uploadId: index === 0 ? UPLOAD_ID : `${UPLOAD_ID}-${index}`,
			contentId: index === 0 ? CONTENT_ID : `${UPLOAD_ID}-${index}@carbonio`,
			isInline: true,
			uploadStatus: { status: 'running', progress: 0 }
		}));
	}) as unknown as AddInlineAttachments;

	vi.spyOn(editorStoreIndex, 'useEditorAttachments').mockReturnValue({
		addInlineAttachments,
		keepOnlyInlineAttachments: vi.fn(),
		addStandardAttachments: vi.fn(),
		addUploadedAttachment: vi.fn()
	} as unknown as ReturnType<typeof editorStoreIndex.useEditorAttachments>);

	return {
		addInlineAttachments,
		failUpload: (): void => {
			options?.onUploadError?.(uploadedFiles[0], UPLOAD_ID, 'upload failed');
		}
	};
}

/**
 * Simulates the outcome of the draft save which persists the pending inline
 * image: the saved attachments of the editor are what the editor watches to
 * replace a preview with the real download url.
 */
export function saveInlineAttachment(editorId: string): void {
	const savedInlineAttachment: SavedAttachment = {
		contentId: CONTENT_ID,
		messageId: MESSAGE_ID,
		partName: PART_NAME,
		contentType: 'image/png',
		size: 1000,
		isInline: true,
		filename: 'pic.png'
	};
	useEditorsStore.getState().setSavedAttachments(editorId, [savedInlineAttachment]);
}
