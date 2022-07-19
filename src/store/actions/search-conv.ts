/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import {
	MailMessage,
	SearchConvParameters,
	SearchConvRequest,
	SearchConvResponse,
	SearchConvReturn
} from '../../types';

export const searchConv = createAsyncThunk<SearchConvReturn, SearchConvParameters>(
	'conversations/searchConv',
	async ({ conversationId, folderId, fetch = 'all' }) => {
		const result = (await soapFetch<SearchConvRequest, SearchConvResponse>('SearchConv', {
			_jsns: 'urn:zimbraMail',
			cid: conversationId,
			query: `inId: "${folderId}"`,
			recip: '2',
			sortBy: 'dateDesc',
			offset: 0,
			fetch,
			needExp: 1,
			limit: 250,
			html: 1,
			max: 250000
		})) as SearchConvResponse;
		const messages = map(result?.m ?? [], (msg) => normalizeMailMessageFromSoap(msg, true));

		return {
			messages,
			orderBy: result.orderBy,
			hasMore: result.more,
			offset: result.offset
		};
	},
	{
		condition: ({ conversationId }: SearchConvParameters, { getState }: any) =>
			getState().conversations?.expandedStatus[conversationId] !== 'complete' &&
			getState().conversations?.expandedStatus[conversationId] !== 'pending'
	}
);
