/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { map } from 'lodash';

import { MAIL_VERIFICATION_HEADERS } from 'constants/index';
import { GetMsgParameters, GetMsgRequest, GetMsgResponse } from 'types/soap/get-msg';

export async function getMsgDecryptSoapApi({
	msgId,
	max,
	smimePassword,
	html
}: GetMsgParameters): Promise<GetMsgResponse> {
	return legacySoapFetch<GetMsgRequest, GetMsgResponse>('GetMsg', {
		_jsns: 'urn:zimbraMail',
		m: {
			html,
			id: msgId,
			needExp: 1,
			header: map(MAIL_VERIFICATION_HEADERS, (header) => ({ n: header })),
			...{ max }
		},
		encryptionPassword: smimePassword
	});
}
