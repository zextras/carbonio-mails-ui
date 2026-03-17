/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { JSNS } from '@zextras/carbonio-shell-ui';
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { map } from 'lodash';

import { MAIL_VERIFICATION_HEADERS } from 'constants/index';
import { GetMsgParameters, GetMsgRequest, GetMsgResponse } from 'types/soap/get-msg';

export async function getMsgSoapApi({
	msgId,
	max,
	part,
	shouldMarkAsRead,
	html
}: GetMsgParameters): Promise<GetMsgResponse> {
	const message: GetMsgRequest['m'] = {
		html,
		id: msgId,
		needExp: 1,
		header: map(MAIL_VERIFICATION_HEADERS, (header) => ({ n: header })),
		part,
		...{ max }
	};
	if (shouldMarkAsRead) {
		message.read = 1;
	}

	return legacySoapFetch<GetMsgRequest, GetMsgResponse>('GetMsg', {
		_jsns: JSNS.mail,
		m: message
	});
}
