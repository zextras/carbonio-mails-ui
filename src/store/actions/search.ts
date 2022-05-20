/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["conversation"] }] */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { keyBy, map, reduce } from 'lodash';
import { normalizeConversation } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import { IncompleteMessage } from '../../types/mail-message';
import { Conversation } from '../../types/conversation';
import { SearchRequest, SearchResponse } from '../../types/soap/';

export type FetchConversationsParameters = {
	folderId: string;
	limit: number;
	before?: Date;
	types?: string;
	sortBy: 'dateDesc' | 'dateAsc';
};

export type FetchConversationsReturn = {
	conversations?: Record<string, Conversation>;
	messages?: Record<string, IncompleteMessage>;
	hasMore: boolean;
	types: string;
};

export const search = createAsyncThunk<
	FetchConversationsReturn | undefined,
	FetchConversationsParameters
>(
	'fetchConversations',
	async ({ folderId, limit = 100, before, types = 'conversation', sortBy = 'dateDesc' }) => {
		const queryPart = [`inId:"${folderId}"`];
		if (before) queryPart.push(`before:${before.getTime()}`);
		const result = (await soapFetch<SearchRequest, SearchResponse>('Search', {
			_jsns: 'urn:zimbraMail',
			limit,
			needExp: 1,
			types,
			recip: '2',
			fullConversation: 1,
			wantContent: 'full',
			sortBy,
			query: queryPart.join(' ')
		})) as SearchResponse;

		if (types === 'conversation') {
			const conversations = map(result?.c ?? [], (obj) =>
				normalizeConversation(obj)
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
		return undefined;
	}
);
