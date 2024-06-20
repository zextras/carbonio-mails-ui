/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetch } from '@zextras/carbonio-shell-ui';
import { isNull, map, omitBy } from 'lodash';

import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import type {
	GetMsgForPrintParameter,
	GetMsgResponse as GetMsgResponseType,
	MailMessage
} from '../../types';

export const getMsgsForPrint = async ({
	ids,
	part
}: GetMsgForPrintParameter): Promise<Array<MailMessage>> => {
	const { GetMsgResponse } = (await soapFetch('Batch', {
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
	})) as { GetMsgResponse: Array<GetMsgResponseType> };
	return map(GetMsgResponse, (re) => {
		const msg = re.m[0];
		return normalizeMailMessageFromSoap(msg, true) as MailMessage;
	});
};
