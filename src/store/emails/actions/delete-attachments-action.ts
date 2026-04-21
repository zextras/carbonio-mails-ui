/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { deleteAttachmentsSoapApi } from 'api/delete-all-attachments-soap-api';
import { publishQuotaChangedEvent } from 'event-bus/publish-event';
import { getMessageById, handleDeleteAttachments } from 'store/emails/store';

export async function deleteAttachmentsEmailStoreAction({
	id,
	attachments
}: {
	id: string;
	attachments: string[];
}): Promise<ReturnType<typeof deleteAttachmentsSoapApi>> {
	const messageSize = getMessageById(id)?.size ?? 0;
	const response = await deleteAttachmentsSoapApi({ id, attachments });
	handleDeleteAttachments(response);
	publishQuotaChangedEvent(messageSize);
	return response;
}
