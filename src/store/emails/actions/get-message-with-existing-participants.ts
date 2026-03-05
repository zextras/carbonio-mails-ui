/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { getMsgSoapApi } from 'api/get-msg-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import {
	normalizeCompleteMailMessageFromSoap,
	normalizeMailMessageFromSoap
} from 'normalizations/normalize-message';
import { updateMessages, updateMessageStatus } from 'store/emails/store';
import { MailMessage, Participant } from 'types/index.d';

async function handleRetrieveMessageWithParticipants(
	messageId: string,
	participants: Array<Participant> | undefined
): Promise<MailMessage | undefined> {
	const html = getUserSettings()?.prefs?.zimbraPrefComposeFormat === 'html';
	updateMessageStatus(messageId, API_REQUEST_STATUS.pending);
	const response = await getMsgSoapApi({ msgId: messageId, max: 250_000, html }).catch(() => {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
	});
	if (!response || 'Fault' in response) {
		updateMessageStatus(messageId, API_REQUEST_STATUS.error);
		return undefined;
	}
	const messages = map(response?.m ?? [], (msg) => ({
		...normalizeCompleteMailMessageFromSoap(msg, html),
		participants
	}));
	updateMessages(messages);
	updateMessageStatus(messageId, API_REQUEST_STATUS.fulfilled);
	return normalizeMailMessageFromSoap({ m: response.m[0], html, isComplete: true });
}

export function getMessageWithExistingParticipantsEmailStoreAction(
	messageId: string,
	participants: Array<Participant> | undefined
): Promise<MailMessage | undefined> {
	return handleRetrieveMessageWithParticipants(messageId, participants);
}
