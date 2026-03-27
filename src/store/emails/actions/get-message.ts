/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { map } from 'lodash';

import { getMsgSoapApi } from 'api/get-msg-soap-api';
import { getMsgDecryptSoapApi } from 'api/get-msg-soap-api-decrypt';
import { API_REQUEST_STATUS } from 'constants/index';
import {
	normalizeCompleteMailMessageFromSoap,
	normalizeMailMessageFromSoap
} from 'normalizations/normalize-message';
import { updateMessages, updateMessageStatus } from 'store/emails/store';
import { MailMessage } from 'types/messages';
import { GetMsgResponse } from 'types/soap/get-msg';

function handleGetMsgResponse(response: GetMsgResponse, html: boolean): void {
	const messages = map(response?.m ?? [], (msg) => normalizeCompleteMailMessageFromSoap(msg, html));
	updateMessages(messages);
}

async function handleRetrieveMessage(
	messageId: string,
	apiCall: (id: string) => Promise<GetMsgResponse>,
	html: boolean
): Promise<MailMessage | undefined> {
	updateMessageStatus(messageId, API_REQUEST_STATUS.pending);
	const response = await apiCall(messageId).catch(() => {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
	});
	if (!response || 'Fault' in response) {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
		return undefined;
	}
	handleGetMsgResponse(response, html);
	updateMessageStatus(messageId, API_REQUEST_STATUS.fulfilled);
	return normalizeMailMessageFromSoap({ m: response.m[0], isComplete: true, html });
}

async function handleDecryptRetrieveMessage(
	messageId: string,
	apiCall: (id: string) => Promise<GetMsgResponse>,
	html: boolean
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
	handleGetMsgResponse(response, html);
	updateMessageStatus(messageId, API_REQUEST_STATUS.fulfilled);
	return normalizeMailMessageFromSoap({ m: response.m[0], isComplete: true, html });
}

export function getMessageEmailStoreAction({
	messageId,
	shouldMarkAsRead,
	html
}: {
	messageId: string;
	shouldMarkAsRead?: boolean;
	html: boolean;
}): Promise<MailMessage | undefined> {
	return handleRetrieveMessage(
		messageId,
		(id) => getMsgSoapApi({ msgId: id, max: 250_000, shouldMarkAsRead, html }),
		html
	);
}

export function getMessageDecryptEmailStoreAction(
	messageId: string,
	smimePassword: string,
	html: boolean
): Promise<MailMessage | undefined> {
	return handleDecryptRetrieveMessage(
		messageId,
		(id) => getMsgDecryptSoapApi({ msgId: id, max: 250_000, smimePassword, html }),
		html
	);
}

export function getFullMessageEmailStoreAction(
	messageId: string,
	html: boolean
): Promise<MailMessage | undefined> {
	return handleRetrieveMessage(messageId, (id) => getMsgSoapApi({ msgId: id, html }), html);
}
