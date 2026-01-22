/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EditorsStateTypeV2, UnsavedAttachment } from 'types/index.d';

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
