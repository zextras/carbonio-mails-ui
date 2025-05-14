/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { map } from 'lodash';

import { getMsgSoapApi } from '../../../api/get-msg-soap-api';
import { getMsgDecryptSoapApi } from '../../../api/get-msg-soap-api-decrypt';
import { API_REQUEST_STATUS } from '../../../constants';
import {
	normalizeCompleteMailMessageFromSoap,
	normalizeMailMessageFromSoap
} from '../../../normalizations/normalize-message';
import { GetMsgResponse, MailMessage } from '../../../types';
import { updateMessages, updateMessageStatus } from '../store';

function handleGetMsgResponse(response: GetMsgResponse): void {
	const messages = map(response?.m ?? [], (msg) => normalizeCompleteMailMessageFromSoap(msg));
	updateMessages(messages);
}

async function handleRetrieveMessage(
	messageId: string,
	apiCall: (id: string) => Promise<GetMsgResponse>
): Promise<MailMessage | undefined> {
	updateMessageStatus(messageId, API_REQUEST_STATUS.pending);

	let response: GetMsgResponse | undefined;
	try {
		response = await apiCall(messageId);
	} catch {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
		return undefined;
	}

	if (!response || 'Fault' in response || !response.m?.length) {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
		return undefined;
	}

	const messages = map(response.m, normalizeCompleteMailMessageFromSoap);
	updateMessages(messages);
	updateMessageStatus(messageId, API_REQUEST_STATUS.fulfilled);

	return messages[0];
}

async function handleDecryptRetrieveMessage(
	messageId: string,
	apiCall: (id: string) => Promise<GetMsgResponse>
): Promise<MailMessage | undefined> {
	updateMessageStatus(messageId, API_REQUEST_STATUS.pending);
	const response = await apiCall(messageId).catch(() => {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
	});
	if (!response || 'Fault' in response) {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
		return undefined;
	}
	const isNotDecrypted =
		response?.m?.some((message) => message.mp?.some((part) => part.filename === 'smime.p7m')) ??
		false;

	if (isNotDecrypted) {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
		return undefined;
	}
	handleGetMsgResponse(response);
	updateMessageStatus(messageId, API_REQUEST_STATUS.fulfilled);
	return normalizeMailMessageFromSoap(response.m[0], true) as MailMessage;
}

export function getMessageEmailStoreAction(
	messageId: string,
	read?: 0 | 1
): Promise<MailMessage | undefined> {
	return handleRetrieveMessage(messageId, (id) => getMsgSoapApi({ msgId: id, max: 250_000, read }));
}

export function getMessageDecryptEmailStoreAction(
	messageId: string,
	smimePassword: string,
	read?: 0 | 1
): Promise<MailMessage | undefined> {
	return handleDecryptRetrieveMessage(messageId, (id) =>
		getMsgDecryptSoapApi({ msgId: id, max: 250_000, smimePassword, read })
	);
}

export function getFullMessageEmailStoreAction(
	messageId: string
): Promise<MailMessage | undefined> {
	return handleRetrieveMessage(messageId, (id) => getMsgSoapApi({ msgId: id }));
}
