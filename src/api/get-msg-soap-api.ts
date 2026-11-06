/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { JSNS } from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse, soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';
import { map } from 'lodash';

import { MAIL_VERIFICATION_HEADERS } from 'constants/index';
import { GetMsgParameters, GetMsgRequest, GetMsgResponse } from 'types/soap/get-msg';

export async function getMsgSoapApi({
	msgId,
	max,
	shouldMarkAsRead,
	html
}: GetMsgParameters): Promise<GetMsgResponse | ErrorSoapBodyResponse> {
	const message: GetMsgRequest['m'] = {
		html,
		id: msgId,
		needExp: 1,
		header: map(MAIL_VERIFICATION_HEADERS, (header) => ({ n: header })),
		...{ max }
	};
	if (shouldMarkAsRead) {
		message.read = 1;
	}

	const { Body } = await soapFetchV2<GetMsgRequest, { GetMsgResponse: GetMsgResponse }>('GetMsg', {
		_jsns: JSNS.mail,
		m: message
	});
	return 'Fault' in Body ? Body : Body.GetMsgResponse;
}
