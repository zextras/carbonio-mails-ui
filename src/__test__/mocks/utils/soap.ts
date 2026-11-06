/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { ErrorSoapBodyResponse, SuccessSoapResponse } from '@zextras/carbonio-shell-ui';

import { SoapSendMsgFault } from 'types/soap/send-msg';

export const buildSoapResponse = <T>(responseData: Record<string, T>): SuccessSoapResponse<T> => ({
	Header: {
		context: {}
	},
	Body: responseData
});

export const buildSoapErrorResponseBody = ({
	code = faker.number.int().toString(),
	detailCode = faker.word.noun().toUpperCase(),
	reason = faker.word.preposition(),
	trace = faker.word.preposition()
}: {
	code?: string;
	detailCode?: string;
	reason?: string;
	trace?: string;
} = {}): ErrorSoapBodyResponse => ({
	Fault: {
		Detail: { Error: { Code: detailCode, Trace: trace } },
		Reason: { Text: reason },
		Code: {
			Value: code
		}
	}
});

// a SendMsg Fault with its arguments, e.g. the addresses the server refused
export const buildSendMsgFaultBody = ({
	detailCode,
	args = []
}: {
	detailCode?: string;
	args?: Array<{ n: string; _content: string }>;
} = {}): SoapSendMsgFault => {
	const { Fault } = buildSoapErrorResponseBody({ detailCode });
	return {
		Fault: {
			...Fault,
			Detail: { Error: { ...Fault.Detail.Error, a: args.map((arg) => ({ ...arg, t: 'STR' })) } }
		}
	};
};
