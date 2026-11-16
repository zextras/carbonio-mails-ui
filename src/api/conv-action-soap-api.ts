/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ErrorSoapBodyResponse, soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';
import { isNil } from 'lodash';

import { omitBy } from 'commons/utils';
import { ConvActionParameters } from 'types/conversations';
import { ConvActionRequest, ConvActionResponse } from 'types/soap/conv-action';

export async function convActionSoapApi({
	ids,
	operation,
	parent,
	tagName,
	tcon
}: ConvActionParameters): Promise<ConvActionResponse | ErrorSoapBodyResponse> {
	const { Body } = await soapFetchV2<ConvActionRequest, { ConvActionResponse: ConvActionResponse }>(
		'ConvAction',
		{
			_jsns: 'urn:zimbraMail',
			action: omitBy(
				{
					id: ids.join(','),
					op: operation,
					l: parent,
					tn: tagName,
					tcon
				},
				isNil
			)
		}
	);
	return 'Fault' in Body ? Body : Body.ConvActionResponse;
}
