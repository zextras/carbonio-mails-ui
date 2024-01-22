/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["conversation"] }] */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { ErrorSoapBodyResponse, getTags, soapFetch } from '@zextras/carbonio-shell-ui';
import { keyBy, map, reduce } from 'lodash';

import { normalizeConversation } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import type {
	Conversation,
	FetchConversationsParameters,
	FetchConversationsReturn,
	SearchRequest,
	SearchResponse
} from '../../types';

export const search = createAsyncThunk<
	FetchConversationsReturn | undefined,
	FetchConversationsParameters
>(
	'fetchConversations',
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
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
		if (sortBy === 'readAsc') queryPart.push('is:unread');

		try {
			const result = await soapFetch<SearchRequest, SearchResponse | ErrorSoapBodyResponse>(
				'Search',
				{
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
				}
			);
			if (!result) {
				return rejectWithValue(undefined);
			}

			if ('Fault' in result) {
				return rejectWithValue(result.Fault);
			}

			const tags = getTags();
			if (types === 'conversation') {
				const conversations = map(result?.c ?? [], (obj, index) => ({
					...normalizeConversation({ c: obj, tags }),
					sortIndex: index + (offset ?? 0)
				})) as unknown as Array<Conversation>;
				return {
					conversations: keyBy(conversations, 'id'),
					hasMore: result.more,
					offset: result.offset,
					types
				};
			}
			if (types === 'message') {
				return {
					messages: reduce(
						result.m ?? [],
						(acc, msg, index) => {
							const normalized = {
								...normalizeMailMessageFromSoap(msg, false),
								sortIndex: index + (offset ?? 0)
							};
							return { ...acc, [normalized.id]: normalized };
						},
						{}
					),
					hasMore: result.more,
					offset: result.offset,
					types
				};
			}
		} catch (err: any) {
			return rejectWithValue(err);
		}
		return undefined;
	}
);
