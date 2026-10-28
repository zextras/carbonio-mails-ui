/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { map } from 'lodash';

import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import { MailMessage } from 'types/messages';
import { GetMsgForPrintParameter, GetMsgForPrintResponse } from 'types/soap/get-msg';

export const getMsgsForPrintSoapApi = async ({
	ids
}: GetMsgForPrintParameter): Promise<Array<MailMessage>> => {
	const { GetMsgResponse } = await legacySoapFetch<unknown, GetMsgForPrintResponse>('Batch', {
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
	return map(GetMsgResponse, (re) => {
		const msg = re.m[0];
		return normalizeMailMessageFromSoap({ m: msg, isComplete: true, html: true });
	});
};
