/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { DefaultBodyType, http, HttpResponse } from 'msw';

import { getSetupServer } from '../vitest-setup';
import { SoapConversation } from 'types/soap/soap-conversation';
import {
	SoapIncompleteMessage,
	SoapMailMessage,
	SoapMailMessagePart
} from 'types/soap/soap-mail-message';
import { SoapMailParticipant } from 'types/soap/soap-mail-participant';

export function generateMessagePartFromAPI(
	params: Partial<SoapMailMessagePart> = {}
): SoapMailMessagePart {
	return {
		part: 'part',
		ct: 'ct',
		...params
	};
}

export function generateFromParticipantFromAPI(
	params: Partial<SoapMailParticipant> = {}
): SoapMailParticipant {
	return {
		a: 'add@re.ss',
		p: 'p',
		t: 'f',
		...params
	};
}

export function generateToParticipantFromAPI(
	params: Partial<SoapMailParticipant> = {}
): SoapMailParticipant {
	return {
		a: 'add@re.ss',
		p: 'p',
		t: 't',
		...params
	};
}

export function generateMessageFromAPI(
	params: Partial<SoapIncompleteMessage> = {}
): SoapIncompleteMessage {
	return {
		id: '456',
		cid: '456',
		l: 'folder1',
		s: 123,
		d: 456,
		...params
	};
}

export function generateCompleteMessageFromAPI(
	params: Partial<SoapMailMessage> = {}
): SoapMailMessage {
	return {
		...generateMessageFromAPI({ id: '987', d: 987 }),
		su: 'Subject',
		fr: 'Fragment',
		e: [
			generateFromParticipantFromAPI({ a: 'from@loc.al' }),
			generateToParticipantFromAPI({ a: 'to@loc.al' })
		],
		mp: [generateMessagePartFromAPI()],
		...params
	};
}

export const generateConvMessageFromAPI = generateCompleteMessageFromAPI;

type HandlerRequest<T> = DefaultBodyType & {
	Body: Record<string, T>;
};

export const createSoapAPIInterceptorWithError = <RequestParamsType>(
	apiAction: string
): Promise<RequestParamsType> =>
	new Promise<RequestParamsType>((resolve) => {
		getSetupServer().use(
			http.post<never, HandlerRequest<RequestParamsType>>(
				`/service/soap/${apiAction}Request`,
				async ({ request }) => {
					const reqActionParamWrapper = `${apiAction}Request`;
					const requestContent = await request.json();
					const params = requestContent?.Body?.[reqActionParamWrapper];
					resolve(params);
					return HttpResponse.error();
				}
			)
		);
	});

export function generateConversationFromAPI(
	params: Partial<SoapConversation> = {}
): SoapConversation {
	return {
		id: '123',
		n: 1,
		u: 1,
		f: 'flag',
		tn: 'tag names',
		d: 123,
		m: [],
		e: [],
		su: 'Subject',
		fr: 'fragment',
		...params
	};
}

export function generateSoapConversationMessage(
	messageId: string,
	conversationId: string
): SoapMailMessage {
	return {
		id: messageId,
		cid: conversationId,
		e: [],
		su: 'conversations Subject',
		s: 71116,
		l: '2',
		f: 'au',
		fr: 'fragment',
		mp: [],
		d: 1717752296000
	};
}
