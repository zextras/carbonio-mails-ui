/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { map } from 'lodash';

import { getMsgSoapApi } from 'api/get-msg-soap-api';
import {
	normalizeCompleteMailMessageFromSoap,
	normalizeMailMessageFromSoap
} from 'normalizations/normalize-message';
import { updateMessages } from 'store/emails/store';
import { MailMessage } from 'types/messages';
import { Participant } from 'types/participant';
import { GetMsgResponse } from 'types/soap/get-msg';

async function handleRetrieveMessageWithParticipants(
	messageId: string,
	apiCall: (id: string) => Promise<GetMsgResponse>,
	participants: Array<Participant> | undefined
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
	const messages = map(response?.m ?? [], (msg) => ({
		...normalizeCompleteMailMessageFromSoap(msg),
		participants
	}));
	updateMessages(messages);
	return normalizeMailMessageFromSoap({ m: response.m[0], isComplete: true });
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
