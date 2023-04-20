/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { isNil } from 'lodash';
import { omitBy } from '../../commons/utils';
import type {
	ConvActionParameters,
	ConvActionRequest,
	ConvActionResponse,
	ConvActionResult
} from '../../types';

export const convAction = createAsyncThunk<ConvActionResult, ConvActionParameters>(
	'convAction',
	async ({ ids, operation, parent, tagName }) => {
		const { action } = (await soapFetch<ConvActionRequest, ConvActionResponse>('ConvAction', {
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
		})) as ConvActionResponse;
		return {
			ids: action.id.split(','),
			operation: action.op
		};
	}
);
