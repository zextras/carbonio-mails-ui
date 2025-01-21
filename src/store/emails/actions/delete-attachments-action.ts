/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { deleteAttachmentsSoapApi } from '../../../api/delete-all-attachments-soap-api';
import { handleDeleteAttachments } from '../store';

export async function deleteAttachmentsEmailStoreAction({
	id,
	attachments
}: {
	id: string;
	attachments: string[];
}): Promise<ReturnType<typeof deleteAttachmentsSoapApi>> {
	const response = await deleteAttachmentsSoapApi({ id, attachments });
	handleDeleteAttachments(response);
	return response;
}
