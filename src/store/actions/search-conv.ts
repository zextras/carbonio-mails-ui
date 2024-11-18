/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { map } from 'lodash';

import { searchConvSoapAPI } from '../../api/search-conv';
import { API_REQUEST_STATUS } from '../../constants';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import type { SearchConvParameters, SearchConvReturn } from '../../types';

export const searchConv = createAsyncThunk<SearchConvReturn, SearchConvParameters>(
	'conversations/searchConv',
	async ({ conversationId, folderId, fetch = 'all' }) => {
		const result = await searchConvSoapAPI({
			conversationId,
			fetch,
			folderId
		});
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
			getState().conversations?.expandedStatus[conversationId] !== API_REQUEST_STATUS.fulfilled &&
			getState().conversations?.expandedStatus[conversationId] !== API_REQUEST_STATUS.pending
	}
);
