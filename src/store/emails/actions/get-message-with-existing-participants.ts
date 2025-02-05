/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { map } from 'lodash';

import { getMsgSoapApi } from '../../../api/get-msg-soap-api';
import { API_REQUEST_STATUS } from '../../../constants';
import {
	normalizeCompleteMailMessageFromSoap,
	normalizeMailMessageFromSoap
} from '../../../normalizations/normalize-message';
import { GetMsgResponse, MailMessage, Participant } from '../../../types';
import { updateMessages, updateMessageStatus } from '../store';

async function handleRetrieveMessageWithParticipants(
	messageId: string,
	apiCall: (id: string) => Promise<GetMsgResponse>,
	participants: Array<Participant> | undefined
): Promise<MailMessage | undefined> {
	updateMessageStatus(messageId, API_REQUEST_STATUS.pending);
	const response = await apiCall(messageId).catch(() => {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
	});
	if (!response || 'Fault' in response) {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
		return undefined;
	}
	const messages = map(response?.m ?? [], (msg) => ({
		...normalizeCompleteMailMessageFromSoap(msg),
		participants
	}));
	updateMessages(messages);
	updateMessageStatus(messageId, API_REQUEST_STATUS.fulfilled);
	return normalizeMailMessageFromSoap(response.m[0], true) as MailMessage;
}

export function getMessageWithExistingParticipantsEmailStoreAction(
	messageId: string,
	participants: Array<Participant> | undefined
): Promise<MailMessage | undefined> {
	return handleRetrieveMessageWithParticipants(
		messageId,
		(id) => getMsgSoapApi({ msgId: id, max: 250_000 }),
		participants
	);
}
