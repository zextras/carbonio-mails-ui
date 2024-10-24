/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { MAIL_VERIFICATION_HEADERS } from '../constants';
import type { GetMsgParameters, GetMsgRequest, GetMsgResponse } from '../types';

export async function getMsgSoapAPI({ msgId, max }: GetMsgParameters): Promise<GetMsgResponse> {
	return soapFetch<GetMsgRequest, GetMsgResponse>('GetMsg', {
		_jsns: 'urn:zimbraMail',
		m: {
			html: 1,
			id: msgId,
			needExp: 1,
			header: map(MAIL_VERIFICATION_HEADERS, (header) => ({ n: header })),
			...{ max }
		}
	});
}
