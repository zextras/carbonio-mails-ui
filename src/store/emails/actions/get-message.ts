/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { map } from 'lodash';

import { getMsgSoapApi } from 'api/get-msg-soap-api';
import { getMsgDecryptSoapApi } from 'api/get-msg-soap-api-decrypt';
import {
	normalizeCompleteMailMessageFromSoap,
	normalizeMailMessageFromSoap
} from 'normalizations/normalize-message';
import { updateMessages } from 'store/emails/store';
import { MailMessage } from 'types/messages';
import { GetMsgResponse } from 'types/soap/get-msg';

function handleGetMsgResponse(response: GetMsgResponse, html?: boolean): void {
	const messages = map(response?.m ?? [], (msg) => normalizeCompleteMailMessageFromSoap(msg, html));
	updateMessages(messages);
}

async function handleRetrieveMessage(
	messageId: string,
	apiCall: (id: string) => Promise<GetMsgResponse>,
	html?: boolean
): Promise<MailMessage | undefined> {
	let response: GetMsgResponse | undefined;
	try {
		response = await apiCall(messageId);
	} catch {
		return undefined;
	}
	if (!response || 'Fault' in response) {
		return undefined;
	}
	handleGetMsgResponse(response, html);
	return normalizeMailMessageFromSoap({ m: response.m[0], isComplete: true, html });
}

async function handleDecryptRetrieveMessage(
	messageId: string,
	apiCall: (id: string) => Promise<GetMsgResponse>
): Promise<MailMessage | undefined> {
	let response: GetMsgResponse | undefined;
	try {
		response = await apiCall(messageId);
	} catch {
		return undefined;
	}
	if (!response || 'Fault' in response) {
		return undefined;
	}
	const isNotDecrypted =
		response?.m?.some((message) => message.mp?.some((part) => part.filename === 'smime.p7m')) ??
		false;

	if (isNotDecrypted) {
		return undefined;
	}
	handleGetMsgResponse(response);
	return normalizeMailMessageFromSoap({ m: response.m[0], isComplete: true });
}

export function getMessageEmailStoreAction(
	messageId: string,
	shouldMarkAsRead?: boolean
): Promise<MailMessage | undefined> {
	return handleRetrieveMessage(messageId, (id) =>
		getMsgSoapApi({ msgId: id, max: 250_000, shouldMarkAsRead })
	);
}

export function getMessageDecryptEmailStoreAction(
	messageId: string,
	smimePassword: string
): Promise<MailMessage | undefined> {
	return handleDecryptRetrieveMessage(messageId, (id) =>
		getMsgDecryptSoapApi({ msgId: id, max: 250_000, smimePassword })
	);
}

export function getFullMessageEmailStoreAction(
	messageId: string,
	html?: boolean
): Promise<MailMessage | undefined> {
	return handleRetrieveMessage(messageId, (id) => getMsgSoapApi({ msgId: id, html }), html);
}
