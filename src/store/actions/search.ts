/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["conversation"] }] */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { getTags, SoapException, soapFetch } from '@zextras/carbonio-shell-ui';
import { keyBy, map, reduce } from 'lodash';
import { normalizeConversation } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import {
	Conversation,
	SearchRequest,
	SearchResponse,
	FetchConversationsReturn,
	FetchConversationsParameters
} from '../../types';

export const search = createAsyncThunk<
	FetchConversationsReturn | undefined,
	FetchConversationsParameters
>(
	'fetchConversations',
	async (
		{
			folderId,
			limit = 100,
			before,
			types = 'conversation',
			sortBy = 'dateDesc',
			query,
			offset,
			recip = '2',
			wantContent = 'full'
		},
		{ rejectWithValue }
	) => {
		const queryPart = [`inId:"${folderId}"`];
		if (before) queryPart.push(`before:${before.getTime()}`);

		try {
			const result = await soapFetch<SearchRequest, SearchResponse>('Search', {
				_jsns: 'urn:zimbraMail',
				limit,
				needExp: 1,
				recip,
				fullConversation: 1,
				wantContent,
				sortBy,
				query: query || queryPart.join(' '),
				offset,
				types
			});

			const tags = getTags();
			if (types === 'conversation') {
				const conversations = map(result?.c ?? [], (obj) =>
					normalizeConversation({ c: obj, tags })
				) as unknown as Array<Conversation>;
				return {
					conversations: keyBy(conversations, 'id'),
					hasMore: result.more,
					types
				};
			}
			if (types === 'message') {
				return {
					messages: reduce(
						result.m ?? [],
						(acc, msg) => {
							const normalized = normalizeMailMessageFromSoap(msg, false);
							return { ...acc, [normalized.id]: normalized };
						},
						{}
					),
					hasMore: result.more,
					types
				};
			}
		} catch (err: any) {
			return rejectWithValue(err?.response ?? err);
		}
		return undefined;
	}
);
