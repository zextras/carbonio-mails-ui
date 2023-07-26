/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reduce } from 'lodash';

import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { saveDraftV3 } from '../../../../store/actions/save-draft';
import { uploadAttachmentsv2 } from '../../../../store/actions/upload-attachments';
import { retrieveAttachmentsType } from '../../../../store/editor-slice-utils';
import { getEditor, getUpdateDraft } from '../../../../store/zustand/editor/hooks';
import type { MailAttachmentParts, MailsEditorV2, SaveDraftResponse } from '../../../../types';

type AddAttachmentsPayloadType = {
	resp: {
		m: Array<any>;
		_jsns: 'urn:zimbraMail';
	};
};

async function addAttachments({
	files,
	editorId
}: {
	files: FileList | null | undefined;
	editorId: MailsEditorV2['id'];
}): Promise<MailAttachmentParts[] | null> {
	const editor = getEditor({ id: editorId });
	if (!editor) {
		console.warn('Cannot find editor', editorId);
		return null;
	}
	if (!files) {
		console.warn('Cannot find files', files);
		return null;
	}
	const firstSaveDraftResponse: SaveDraftResponse = await saveDraftV3({ editor });
	const upload = await uploadAttachmentsv2({ files });
	const aid = reduce(
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		upload,
		(acc: Array<string>, v: { aid: string }): Array<string> => [...acc, v.aid],
		[]
	).join(',');
	const message = normalizeMailMessageFromSoap(firstSaveDraftResponse?.m?.[0]);
	const mp = retrieveAttachmentsType(message, 'attachment');
	const secondSaveDraftResponse = await saveDraftV3({
		editor: {
			...editor,
			id: firstSaveDraftResponse?.m?.[0].id,
			attach: [...editor.attachments, { aid, mp }]
		}
	});
	const messageToParse = normalizeMailMessageFromSoap(secondSaveDraftResponse?.m?.[0]);
	return retrieveAttachmentsType(messageToParse, 'attachment');
}

export function addAttachmentsToEditor({
	files,
	editorId
}: {
	files: FileList | null | undefined;
	editorId: MailsEditorV2['id'];
}): void {
	if (!files) {
		return;
	}
	addAttachments({ files, editorId }).then((res) => {
		getUpdateDraft({
			editorId,
			attachment: { mp: res }
		});
	});
}
