/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { isNil, omitBy } from 'lodash';
import { MsgActionRequest, MsgActionResponse, MsgActionOperation } from '../../types/soap/';

export type MsgActionParameters = {
	ids: string[];
	operation: MsgActionOperation;
	parent?: string;
	tagName: string;
};

export type MsgActionResult = {
	ids: string[];
	operation: MsgActionOperation;
};

export const msgAction = createAsyncThunk<MsgActionResult, MsgActionParameters>(
	'msgAction',
	async ({ ids, operation, parent, tagName }) => {
		const { action } = (await soapFetch<MsgActionRequest, MsgActionResponse>('MsgAction', {
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
		})) as MsgActionResponse;
		return {
			ids: action.id.split(','),
			operation: action.op
		};
	}
);
