/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { omitBy, isNil } from 'lodash';

import { MsgActionParameters, MsgActionRequest, MsgActionResponse } from 'types/soap/msg-action';

export const msgActionSoapApi = async ({
	ids,
	operation,
	parent,
	tagName,
	flag
}: MsgActionParameters): Promise<MsgActionResponse | ErrorSoapBodyResponse> =>
	legacySoapFetch<MsgActionRequest, MsgActionResponse | ErrorSoapBodyResponse>('MsgAction', {
		_jsns: 'urn:zimbraMail',

		action: omitBy(
			{
				id: ids.join(','),
				op: operation,
				l: parent,
				tn: tagName,
				f: flag
			},
			isNil
		)
	});
