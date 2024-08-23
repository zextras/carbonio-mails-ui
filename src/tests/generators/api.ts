/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { DefaultBodyType, http, HttpResponse } from 'msw';

import { getSetupServer } from '../../carbonio-ui-commons/test/jest-setup';
import {
	SoapIncompleteMessage,
	SoapMailMessage,
	SoapMailMessagePart,
	SoapMailParticipant
} from '../../types';

export function generateMessagePartFromAPI(
	params: Partial<SoapMailMessagePart> = {}
): SoapMailMessagePart {
	return {
		part: 'part',
		ct: 'ct',
		requiresSmartLinkConversion: false,
		...params
	};
}
export function generateConvMessageFromAPI(params: Partial<SoapMailMessage> = {}): SoapMailMessage {
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
