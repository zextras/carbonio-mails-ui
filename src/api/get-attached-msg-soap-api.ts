/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { JSNS } from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse, soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';
import { map } from 'lodash';

import { MAIL_VERIFICATION_HEADERS } from 'constants/index';
import {
	GetAttachedMsgParameters,
	GetAttachedMsgResponse,
	GetMsgRequest
} from 'types/soap/get-msg';

// GetMsg of a message attached to another one (an .eml), read from its part
export async function getAttachedMsgSoapApi({
	msgId,
	part,
	html
}: GetAttachedMsgParameters): Promise<GetAttachedMsgResponse | ErrorSoapBodyResponse> {
	const { Body } = await soapFetchV2<GetMsgRequest, { GetMsgResponse: GetAttachedMsgResponse }>(
		'GetMsg',
		{
			_jsns: JSNS.mail,
			m: {
				html,
				id: msgId,
				needExp: 1,
				header: map(MAIL_VERIFICATION_HEADERS, (header) => ({ n: header })),
				part
			}
		}
	);
	return 'Fault' in Body ? Body : Body.GetMsgResponse;
}
