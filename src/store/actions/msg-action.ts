/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/zapp-shell';
import { MsgActionRequest, MsgActionResponse, MsgActionOperation } from '../../types/soap/';

export type MsgActionParameters = {
	ids: string[];
	operation: MsgActionOperation;
	parent?: string;
	tag?: string;
};

export type MsgActionResult = {
	ids: string[];
	operation: MsgActionOperation;
};

export const msgAction = createAsyncThunk<MsgActionResult, MsgActionParameters>(
	'msgAction',
	async ({ ids, operation, parent, tag }) => {
		const { action } = (await soapFetch<MsgActionRequest, MsgActionResponse>('MsgAction', {
			_jsns: 'urn:zimbraMail',
			action: {
				id: ids.join(','),
				op: operation,
				l: parent,
				tn: tag
			}
		})) as MsgActionResponse;
		return {
			ids: action.id.split(','),
			operation: action.op
		};
	}
);
