import { map } from 'lodash';

import { getMsgSoapApi } from '../../../api/get-msg-soap-api';
import { API_REQUEST_STATUS } from '../../../constants';
import {
	normalizeCompleteMailMessageFromSoap,
	normalizeMailMessageFromSoap
} from '../../../normalizations/normalize-message';
import { GetMsgResponse, MailMessage } from '../../../types';
import { updateMessages, updateMessageStatus } from '../store';

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
function handleGetMsgResponse(response: GetMsgResponse): void {
	const messages = map(response?.m ?? [], (msg) => normalizeCompleteMailMessageFromSoap(msg));
	updateMessages(messages);
}
export async function handleRetrieveMessage(
	messageId: string,
	apiCall: (id: string) => Promise<GetMsgResponse>
): Promise<MailMessage | undefined> {
	updateMessageStatus(messageId, API_REQUEST_STATUS.pending);
	const response = await apiCall(messageId).catch(() => {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
	});
	if (!response) return undefined;
	if ('Fault' in response) {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
		return undefined;
	}
	handleGetMsgResponse(response);
	updateMessageStatus(messageId, API_REQUEST_STATUS.fulfilled);
	return normalizeMailMessageFromSoap(response.m[0], true) as MailMessage;
}
export function getMessageEmailStoreAction(messageId: string): Promise<MailMessage | undefined> {
	return handleRetrieveMessage(messageId, (id) => getMsgSoapApi({ msgId: id, max: 250_000 }));
}

export function getFullMessageEmailStoreAction(
	messageId: string
): Promise<MailMessage | undefined> {
	return handleRetrieveMessage(messageId, (id) => getMsgSoapApi({ msgId: id }));
}
