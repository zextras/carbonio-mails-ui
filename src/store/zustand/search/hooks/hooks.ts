/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type ErrorSoapBodyResponse, getTags, Tags } from '@zextras/carbonio-shell-ui';
import { reduce } from 'lodash';

import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeConversation } from '../../../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { Conversation, SearchResponse } from '../../../../types';
import { useMessagesStore } from '../../messages-store/store';
import { useSearchStore } from '../store';

export function useConversation(id: string): Conversation {
	return useMessagesStore(({ conversations }) => conversations[id]);
}

function handleFulFilledConversationResults({
	searchResponse,
	offset,
	tags
}: {
	searchResponse: SearchResponse;
	offset: number;
	tags: Tags;
}): void {
	const conversations = reduce(
		searchResponse.c ?? [],
		(acc, conv, index) => {
			const normalizedConversation = {
				...normalizeConversation({ c: conv, tags }),
				sortIndex: index + (offset ?? 0)
			};
			return { ...acc, [normalizedConversation.id]: normalizedConversation };
		},
		{}
	);
	const conversationIds = new Set(searchResponse.c?.map((conv) => conv.id));
	useMessagesStore.getState().setConversations(conversations);
	useSearchStore.getState().setState({
		conversationIds,
		offset: searchResponse.offset,
		status: API_REQUEST_STATUS.fulfilled
	});
}

function handleFulFilledMessagesResults({
	searchResponse,
	offset
}: {
	searchResponse: SearchResponse;
	offset: number;
}): void {
	const normalizedMessages = {
		messages: reduce(
			searchResponse.m ?? [],
			(acc, msg, index) => {
				const normalized = {
					...normalizeMailMessageFromSoap(msg, false),
					sortIndex: index + (offset ?? 0)
				};
				return { ...acc, [normalized.id]: normalized };
			},
			{}
		),
		hasMore: searchResponse.more,
		offset: searchResponse.offset
	};
	useSearchStore.setState({
		messageIds: new Set(Object.keys(normalizedMessages)),
		offset: searchResponse.offset
	});
}

export function handleSearchResults({
	searchResponse,
	offset
}: {
	searchResponse: SearchResponse | ErrorSoapBodyResponse;
	offset: number;
}): void {
	if ('Fault' in searchResponse) {
		return;
	}
	const tags = getTags();

	if (searchResponse.c) {
		handleFulFilledConversationResults({ searchResponse, offset, tags });
	}

	if (searchResponse.m) {
		handleFulFilledMessagesResults({ searchResponse, offset });
	}
}
