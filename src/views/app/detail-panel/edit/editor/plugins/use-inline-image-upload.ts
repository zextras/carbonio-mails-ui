/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { type LexicalEditor } from 'lexical';

import {
	REMOVE_INLINE_IMAGE_COMMAND,
	type ResolvedInlineImage,
	type ResolveInlineImages
} from './image-plugin';
import { composeCidUrlFromContentId } from 'store/editor/editor-transformations';
import { useEditorAttachments } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';

/**
 * An inline image whose upload (and the draft save that follows it) is still in
 * flight. Its cid is already known, since it is assigned to the unsaved
 * attachment before the upload even starts, and is the handle used to update the
 * image once the draft has been saved.
 */
export type PendingInlineImage = {
	file: File;
	uploadId: string;
	cidUrl: string;
};

export type UploadInlineImagesCallbacks = {
	onFailed: (uploadId: string) => void;
};

export type UploadInlineImagesHandler = (
	files: Array<File>,
	callbacks: UploadInlineImagesCallbacks
) => Array<PendingInlineImage>;

/**
 * Starts the upload of the given files as inline attachments of the editor's
 * draft and returns, synchronously, the cid assigned to each one of them.
 */
export const useInlineImageUpload = (editorId: MailsEditorV2['id']): UploadInlineImagesHandler => {
	const { addInlineAttachments } = useEditorAttachments(editorId);

	return useCallback<UploadInlineImagesHandler>(
		(files, { onFailed }) => {
			const unsavedAttachments = addInlineAttachments(files, {
				onUploadError: (_file, uploadId): void => onFailed(uploadId)
			});

			// `uploadAttachmentsApi` maps over the given files preserving their order,
			// so the nth unsaved attachment always describes the nth file.
			return unsavedAttachments.reduce<Array<PendingInlineImage>>(
				(pendingImages, attachment, index) => {
					const cidUrl = attachment.contentId
						? composeCidUrlFromContentId(attachment.contentId)
						: null;
					if (cidUrl && attachment.uploadId) {
						pendingImages.push({ file: files[index], uploadId: attachment.uploadId, cidUrl });
					}
					return pendingImages;
				},
				[]
			);
		},
		[addInlineAttachments]
	);
};

/**
 * Uploads the given image files as inline attachments and resolves them, right
 * away, to a local preview url, without waiting for the (debounced) draft save:
 * each image is displayed through that preview until `InlineImageSrcSyncPlugin`
 * replaces it with the real download url, which happens as soon as the image is
 * part of the saved draft. An image whose upload fails is removed again, since it
 * will never be attached to the message.
 */
export function resolveInlineImagesWithPreview(
	editor: LexicalEditor,
	upload: UploadInlineImagesHandler,
	files: Array<File>,
	onComplete: (images: Array<ResolvedInlineImage>) => void
): void {
	const previewsByUploadId = new Map<string, { cidUrl: string; previewSrc: string }>();

	const pendingImages = upload(files, {
		onFailed: (uploadId): void => {
			const failedPreview = previewsByUploadId.get(uploadId);
			if (!failedPreview) {
				return;
			}
			previewsByUploadId.delete(uploadId);
			editor.dispatchCommand(REMOVE_INLINE_IMAGE_COMMAND, { cidUrl: failedPreview.cidUrl });
			URL.revokeObjectURL(failedPreview.previewSrc);
		}
	});

	// Uploads can only fail asynchronously, so the previews map is always
	// populated by the time `onFailed` is invoked.
	onComplete(
		pendingImages.map(({ file, uploadId, cidUrl }) => {
			const previewSrc = URL.createObjectURL(file);
			previewsByUploadId.set(uploadId, { cidUrl, previewSrc });
			return { src: previewSrc, cidUrl };
		})
	);
}

/**
 * The {@link ResolveInlineImages} implementation of the mail composer: the
 * picked images become inline attachments of the draft.
 */
export const useInlineImageResolver = (editorId: MailsEditorV2['id']): ResolveInlineImages => {
	const uploadInlineImages = useInlineImageUpload(editorId);

	return useCallback<ResolveInlineImages>(
		(editor, files, onComplete) =>
			resolveInlineImagesWithPreview(editor, uploadInlineImages, files, onComplete),
		[uploadInlineImages]
	);
};
