/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { isNil, omitBy } from 'lodash';
import { ConvActionOperation, ConvActionRequest, ConvActionResponse } from '../../types/soap/';

export type ConvActionParameters = {
	ids: Array<string>;
	operation: ConvActionOperation;
	parent?: string;
	tagName?: string;
};

export type ConvActionResult = {
	ids: Array<string>;
	operation: ConvActionOperation;
};

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
