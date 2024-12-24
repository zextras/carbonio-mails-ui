/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { isNil } from 'lodash';

import { omitBy } from '../../commons/utils';
import type { ConvActionParameters, ConvActionRequest, ConvActionResponse } from '../../types';

export async function convAction({
	ids,
	operation,
	parent,
	tagName
}: ConvActionParameters): Promise<ConvActionResponse> {
	return soapFetch<ConvActionRequest, ConvActionResponse>('ConvAction', {
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
