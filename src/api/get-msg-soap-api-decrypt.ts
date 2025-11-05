/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { map } from 'lodash';

import { MAIL_VERIFICATION_HEADERS } from 'constants/index';
import type { GetMsgParameters, GetMsgRequest, GetMsgResponse } from 'types/index.d';

export async function getMsgDecryptSoapApi({
	msgId,
	max,
	smimePassword,
	read
}: GetMsgParameters): Promise<GetMsgResponse> {
	const mObject: GetMsgRequest['m'] = {
		html: 1,
		id: msgId,
		needExp: 1,
		header: map(MAIL_VERIFICATION_HEADERS, (header) => ({ n: header })),
		...{ max }
	};
	if (read) {
		mObject.read = 1;
	}

	return legacySoapFetch<GetMsgRequest, GetMsgResponse>('GetMsg', {
		_jsns: 'urn:zimbraMail',
		m: mObject,
		encryptionPassword: smimePassword
	});
}
