/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { isNil } from 'lodash';

import { omitBy } from 'commons/utils';
import { ConvActionParameters } from 'types/conversations';
import { ConvActionRequest, ConvActionResponse } from 'types/soap/conv-action';

export async function convActionSoapApi({
	ids,
	operation,
	parent,
	tagName
}: ConvActionParameters): Promise<ConvActionResponse> {
	return legacySoapFetch<ConvActionRequest, ConvActionResponse>('ConvAction', {
		_jsns: 'urn:zimbraMail',
		action: omitBy(
			{
				id: ids.join(','),
				op: operation,
				l: parent,
				tn: tagName
			},
			isNil
		)
	});
}
