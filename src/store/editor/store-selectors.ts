/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { UnsavedAttachment } from 'types/attachments';
import { MailsEditorV2 } from 'types/editor';
import { EditorsStateTypeV2 } from 'types/state';

export const selectUnsavedAttachmentByUploadId = (
	state: EditorsStateTypeV2,
	editorId: string,
	uploadId: string
): UnsavedAttachment | undefined => {
	if (!state?.editors?.[editorId]) {
		return undefined;
	}
	return state.editors[editorId].unsavedAttachments.filter(
		(attachment) => attachment.uploadId === uploadId
	)?.[0];
};

/**
 * Returns the raw size (in bytes, not base64-encoded) of the attachments that are
 * part of the editor but are not yet reflected in `editor.size`, because the draft
 * has not been saved since they were added. Attachments whose upload was aborted are
 * ignored since they will never be part of the message.
 */
export const selectUnsavedAttachmentsSize = (
	editor: Pick<MailsEditorV2, 'unsavedAttachments'>
): number =>
	editor.unsavedAttachments.reduce(
		(acc, attachment) =>
			attachment.uploadStatus?.status === 'aborted' ? acc : acc + attachment.size,
		0
	);
