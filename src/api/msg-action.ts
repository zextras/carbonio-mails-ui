/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetch } from '@zextras/carbonio-shell-ui';
import { omitBy, isNil } from 'lodash';

import {
	MsgActionParameters,
	MsgActionRequest,
	MsgActionResponse,
	MsgActionResult
} from '../types';

export const msgActionSoapApi = async ({
	ids,
	operation,
	parent,
	tagName,
	flag
}: MsgActionParameters): Promise<MsgActionResult> => {
	const { action } = await soapFetch<MsgActionRequest, MsgActionResponse>('MsgAction', {
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
	return {
		ids: action.id.split(','),
		operation: action.op
	};
};
