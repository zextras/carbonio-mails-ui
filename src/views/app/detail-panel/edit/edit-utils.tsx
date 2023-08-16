/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getUserSettings } from '@zextras/carbonio-shell-ui';
import { AxiosProgressEvent } from 'axios';
import { forEach, map, reduce, find } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { saveDraftV3 } from '../../../../store/actions/save-draft';
import { uploadAttachmentsv2 } from '../../../../store/actions/upload-attachments';
import { retrieveAttachmentsType } from '../../../../store/editor-slice-utils';
import { useEditorsStore } from '../../../../store/zustand/editor';
import {
	getAddAttachmentFiles,
	getEditor,
	getUpdateUploadProgress
} from '../../../../store/zustand/editor/hooks';
import type { MailAttachmentParts, MailsEditorV2, SaveDraftResponse } from '../../../../types';

type AddAttachmentsPayloadType = {
	resp: {
		m: Array<any>;
		_jsns: 'urn:zimbraMail';
	};
};
function onUploadProgress({
	editorId,
	progressEvent,
	attachmentFiles,
	file
}: {
	editorId: MailsEditorV2['id'];
	progressEvent: AxiosProgressEvent;
	attachmentFiles: MailsEditorV2['attachmentFiles'];
	file: File;
}): void {
	const { loaded, total } = progressEvent;
	const percentCompleted = (total && Math.round((loaded * 100) / total)) ?? 0;
	const fileUploadingId =
		find(
			attachmentFiles,
			(attachmentFile) => attachmentFile.name === file.name && attachmentFile.size === file.size
		)?.id ?? '';
	getUpdateUploadProgress({ editorId, percentCompleted, fileUploadingId });
}
async function addAttachments({
	files,
	editorId
}: {
	files: FileList | null | undefined;
	editorId: MailsEditorV2['id'];
}): Promise<MailAttachmentParts[] | null> {
	const editor = getEditor({ id: editorId });
	if (!editor) {
		return null;
	}
	if (!files) {
		return null;
	}
	const attachmentFiles: MailsEditorV2['attachmentFiles'] = map(files, (file) => ({
		id: uuidv4(),
		filename: file.name,
		name: file.name,
		fileSize: file.size,
		size: file.size,
		type: file.type,
		uploadProgress: 0,
		contentType: file.type
	}));

	// create a new optimistic attachment
	getAddAttachmentFiles({ id: editorId, attachmentFiles });

	const firstSaveDraftResponse: SaveDraftResponse = await saveDraftV3({
		editor,
		attach: editor.attachments
	});
	const upload = await uploadAttachmentsv2({ files, onUploadProgress, editorId, attachmentFiles });
	if (!upload[0]) {
		return null;
	}

	const aid = reduce(
		upload as Array<{ aid: string }>,
		(acc: Array<string>, v: { aid: string }): Array<string> => [...acc, v.aid],
		[]
	).join(',');
	const message = normalizeMailMessageFromSoap(firstSaveDraftResponse?.m?.[0]);
	const mp = retrieveAttachmentsType(message, 'attachment');
	const secondSaveDraftResponse = await saveDraftV3({
		editor: {
			...editor,
			id: firstSaveDraftResponse.m?.[0].id ?? ''
		},
		attach: { ...editor.attachments, aid, mp }
	});
	// secondSaveDraftResponse.m &&
	// useEditorsStore.getState().updateDraft(editor.id, secondSaveDraftResponse);
	const messageToParse = normalizeMailMessageFromSoap(secondSaveDraftResponse?.m?.[0]);
	return retrieveAttachmentsType(messageToParse, 'attachment');
}

export async function addAttachmentsToEditor({
	files,
	editorId,
	onUploadProgress,
	onFileTooLarge
}: {
	files: FileList | null | undefined;
	editorId: MailsEditorV2['id'];
	onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
	onFileTooLarge?: () => void;
}): Promise<void> {
	if (!files) {
		return;
	}
	const { zimbraFileUploadMaxSize } = getUserSettings().attrs;
	forEach(files, (file) => {
		if (file.size > Number(zimbraFileUploadMaxSize)) {
			onFileTooLarge && onFileTooLarge();
		}
	});

	const res = await addAttachments({ files, editorId, onUploadProgress });
	if (res) {
		console.log('@@resOFaddAttachments', { res });

		let { attachments } = useEditorsStore.getState().editors[editorId];
		attachments = { ...attachments, ...res };
	}
}
