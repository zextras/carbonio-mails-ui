/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { GenericSoapApiError } from '@zextras/carbonio-ui-commons';
import { soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';
import { map } from 'lodash';

import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import { MailMessage } from 'types/messages';
import { GetMsgForPrintParameter, GetMsgForPrintResponse } from 'types/soap/get-msg';

export const getMsgsForPrintSoapApi = async ({
	ids
}: GetMsgForPrintParameter): Promise<Array<MailMessage>> => {
	const { Body } = await soapFetchV2<unknown, { BatchResponse: GetMsgForPrintResponse }>('Batch', {
		GetMsgRequest: map(ids, (id) => ({
			m: {
				html: 1,
				id,
				needExp: 1,
				read: 1
			},
			_jsns: 'urn:zimbraMail'
		})),
		_jsns: 'urn:zimbra'
	});
	const response = 'Fault' in Body ? Body : Body.BatchResponse;
	const GetMsgResponse = 'GetMsgResponse' in response ? response.GetMsgResponse : undefined;
	// A failed Batch has a single Fault, a BatchResponse one Fault per message that failed
	const fault = Array.isArray(response.Fault) ? response.Fault[0] : response.Fault;
	if (!GetMsgResponse && fault) {
		throw new GenericSoapApiError(fault);
	}
	return map(GetMsgResponse, (re) => {
		const msg = re.m[0];
		return normalizeMailMessageFromSoap({ m: msg, isComplete: true, html: true });
	});
};
