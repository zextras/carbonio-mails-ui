/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetch } from '@zextras/carbonio-shell-ui';
import { isNull, map, omitBy } from 'lodash';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import { GetMsgForPrintParameter, MailMessage } from '../../types';

export const getMsgsForPrint = async ({ ids, part }: GetMsgForPrintParameter): Promise<any> => {
	const { GetMsgResponse } = await soapFetch('Batch', {
		GetMsgRequest: map(ids, (id) => ({
			m: omitBy(
				{
					html: 1,
					id,
					needExp: 1,
					max: 250000,
					part,
					read: 1
				},
				isNull
			),
			_jsns: 'urn:zimbraMail'
		})),
		_jsns: 'urn:zimbra'
	});
	const groupedMsgs = map(GetMsgResponse, (re) => {
		const msg = re.m[0];
		return normalizeMailMessageFromSoap(msg, true) as MailMessage;
	});
	return groupedMsgs;
};
