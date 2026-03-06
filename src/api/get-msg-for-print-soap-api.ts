/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { isNull, map, omitBy } from 'lodash';

import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import { MailMessage } from 'types/messages';
import { GetMsgForPrintParameter } from 'types/soap/get-msg';

export const getMsgsForPrintSoapApi = async ({
	ids,
	part
}: GetMsgForPrintParameter): Promise<Array<MailMessage>> => {
	const { GetMsgResponse } = (await legacySoapFetch('Batch', {
		GetMsgRequest: map(ids, (id) => ({
			m: omitBy(
				{
					html: 1,
					id,
					needExp: 1,
					part,
					read: 1
				},
				isNull
			),
			_jsns: 'urn:zimbraMail'
		})),
		_jsns: 'urn:zimbra'
	})) as any; /* as { GetMsgResponse: Array<GetMsgResponseType> } */ // TODO FIX THIS TYPE
	return map(GetMsgResponse, (re) => {
		const msg = re.m[0];
		return normalizeMailMessageFromSoap(msg, true) as MailMessage;
	});
};
