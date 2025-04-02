/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Editor } from 'tinymce';
import { v4 as uuid } from 'uuid';

import { uploadFileApi } from '../../../../../api/upload-file-api';
import { composeAttachmentDownloadUrl } from '../../../../../helpers/attachments';
import { normalizeMailMessageFromSoap } from '../../../../../normalizations/normalize-message';
import { getEditor, useEditorsStore } from '../../../../../store/editor';
import {
	buildSavedAttachments,
	composeCidUrlFromContentId
} from '../../../../../store/editor/editor-transformations';
import { getSavedInlineAttachmentByContentId } from '../../../../../store/editor/editor-utils';
import { saveDraftEmailStoreAction } from '../../../../../store/emails/actions/save-draft-action';
import { MailsEditorV2, UnsavedAttachment } from '../../../../../types';

type UploadImageResult = {
	downloadServiceUrl: string;
	cidUrl: string | undefined;
	contentId: string;
	fileName: string;
};
const uploadQueue: File[] = [];
let isUploading = false;

async function uploadImage(file: File, editorId: string): Promise<UploadImageResult> {
	const { aid } = await uploadFileApi(file);
	const contentId = `${aid}@carbonio`;

	// Create unsaved attachment
	const unsavedAttachment: UnsavedAttachment = {
		filename: file.name,
		contentType: file.type,
		size: file.size,
		contentId,
		aid,
		uploadId: uuid(),
		isInline: true,
		uploadStatus: {
			status: 'running',
			progress: 0
		}
	};

	// Update editor state
	const editor = getEditor({ id: editorId }) as MailsEditorV2;
	const updatedEditor: MailsEditorV2 = {
		...editor,
		unsavedAttachments: [...editor.unsavedAttachments, unsavedAttachment]
	};

	// Save draft and wait for response
	const saveDraftResponse = await saveDraftEmailStoreAction({ editor: updatedEditor });

	if (!saveDraftResponse?.m?.[0]) {
		throw new Error('No message found in save draft response');
	}

	// Process the response
	const mailMessage = normalizeMailMessageFromSoap(saveDraftResponse.m[0], true);
	const editorsStore = useEditorsStore.getState();

	// Update store
	editorsStore.setDid(editorId, mailMessage.id);
	editorsStore.setSize(editorId, mailMessage.size);
	editorsStore.removeUnsavedAttachments(editorId);

	// Handle saved attachments
	const savedAttachments = buildSavedAttachments(mailMessage);
	editorsStore.setSavedAttachments(editorId, savedAttachments);

	// Find the inline attachment
	const newEditor = getEditor({ id: editorId }) as MailsEditorV2;
	const savedInlineAttachment = getSavedInlineAttachmentByContentId(
		contentId,
		newEditor.savedAttachments
	);

	if (!savedInlineAttachment?.contentId) {
		throw new Error('Inline attachment not found after upload');
	}

	return {
		contentId: savedInlineAttachment.contentId,
		cidUrl: composeCidUrlFromContentId(savedInlineAttachment.contentId) ?? undefined,
		downloadServiceUrl: composeAttachmentDownloadUrl(savedInlineAttachment),
		fileName: file.name
	};
}

const processNextUpload = async (editor: Editor, editorId: string): Promise<void> => {
	if (isUploading || uploadQueue.length === 0) return;

	isUploading = true;
	editor.setProgressState(true);

	const file = uploadQueue.shift();
	if (file) {
		const uploadImageResult = await uploadImage(file, editorId);
		if (!uploadImageResult || !uploadImageResult.cidUrl) {
			throw new Error('No CID URL found in upload response');
		}

		editor.insertContent(
			`<img alt="${uploadImageResult.fileName}" src="${uploadImageResult.downloadServiceUrl}" 
                  data-mce-src="${uploadImageResult.cidUrl}" />`
		);
	}

	isUploading = false;
	if (uploadQueue.length > 0) {
		processNextUpload(editor, editorId);
	} else {
		editor.setProgressState(false);
	}
};

export const handleEditorPaste = (
	editor: Editor,
	editorId: string,
	event: ClipboardEvent
): void => {
	const { clipboardData } = event;
	if (!clipboardData) return;

	const validImages = Array.from(clipboardData.items)
		.filter((item) => item.type.includes('image'))
		.map((item) => item.getAsFile())
		.filter((file): file is File => file !== null);

	if (validImages.length === 0) return;
	event.preventDefault();
	uploadQueue.push(...validImages);
	if (!isUploading) {
		processNextUpload(editor, editorId);
	}
};
