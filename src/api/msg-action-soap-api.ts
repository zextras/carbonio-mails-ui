/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';
import { omitBy, isNil } from 'lodash';

import { MsgActionParameters, MsgActionRequest, MsgActionResponse } from 'types/soap/msg-action';

export const msgActionSoapApi = async ({
	ids,
	operation,
	parent,
	tagName,
	flag
}: MsgActionParameters): Promise<MsgActionResponse | ErrorSoapBodyResponse> => {
	const { Body } = await soapFetchV2<MsgActionRequest, { MsgActionResponse: MsgActionResponse }>(
		'MsgAction',
		{
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
		}
	);
	return 'Fault' in Body ? Body : Body.MsgActionResponse;
};
