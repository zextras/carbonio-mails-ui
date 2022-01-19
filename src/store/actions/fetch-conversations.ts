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
import { IncompleteMessage, MailMessage } from '../../types/mail-message';
import { Conversation } from '../../types/conversation';
import { SearchRequest, SearchResponse, SoapIncompleteMessage } from '../../types/soap/';

export type FetchConversationsParameters = {
	folderId: string;
	limit: number;
	before?: Date;
};

export type FetchConversationsReturn = {
	conversations: Record<string, Conversation>;
	messages: Record<string, IncompleteMessage>;
	hasMore: boolean;
};

export const fetchConversations = createAsyncThunk<
	FetchConversationsReturn,
	FetchConversationsParameters
>('fetchConversations', async ({ folderId, limit = 100, before }) => {
	const queryPart = [`inId:${folderId}`];
	if (before) queryPart.push(`before:${before.getTime()}`);
	const result = (await soapFetch<SearchRequest, SearchResponse>('Search', {
		_jsns: 'urn:zimbraMail',
		limit,
		needExp: 1,
		types: 'conversation',
		recip: '2',
		fullConversation: 1,
		wantContent: 'full',
		sortBy: 'dateDesc',
		query: queryPart.join(' ')
	})) as SearchResponse;
	const conversations = map(result?.c ?? [], (obj) =>
		normalizeConversation(obj)
	) as unknown as Array<Conversation>;
	const messages = reduce(
		result?.c ?? [],
		(acc, v) =>
			v?.m?.length > 0
				? [
						...acc,
						...map(v.m, (m) =>
							normalizeMailMessageFromSoap(
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								{ ...m, d: m.d ? Number(m.d) : undefined, s: m.s ? Number(m.s) : undefined },
								false
							)
						)
				  ]
				: acc,
		[] as Array<IncompleteMessage>
	);
	return {
		conversations: keyBy(conversations, 'id'),
		messages: keyBy(messages, 'id'),
		hasMore: result.more
	};
});
