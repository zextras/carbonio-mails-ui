/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type ErrorSoapBodyResponse, getTags, Tags } from '@zextras/carbonio-shell-ui';
import { map, reduce } from 'lodash';

import { normalizeConversation } from '../../../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { NormalizedConversation, SearchResponse } from '../../../../types';
import { messageStoreActions, useMessageStore } from '../../message-store/store';

export function useConversation(id: string): NormalizedConversation {
	return useMessageStore((state) => state.populatedItems.conversations[id]);
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
	const conversations = map(searchResponse.c, (conv) => normalizeConversation({ c: conv, tags }));
	messageStoreActions.updateConversations(conversations, offset);
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
		offset
	};
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
