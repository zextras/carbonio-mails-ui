/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type ErrorSoapBodyResponse, getTags, Tags } from '@zextras/carbonio-shell-ui';
import { reduce } from 'lodash';

import { normalizeConversation } from '../../../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { Conversation, SearchResponse } from '../../../../types';
import { useSearchStore } from '../store';

export function useConversation(id: string): Conversation {
	return useSearchStore(({ conversations }) => conversations[id]);
}

function handleConversationResults({
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
	useSearchStore.setState({
		conversations,
		offset: searchResponse.offset
	});
}

function handleMessagesResults({
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
		messages: normalizedMessages,
		offset: searchResponse.offset
	});
}

export function useHandleSearchResults({
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
		handleConversationResults({ searchResponse, offset, tags });
	}

	if (searchResponse.m) {
		handleMessagesResults({ searchResponse, offset });
	}
}
