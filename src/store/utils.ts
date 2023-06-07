/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { includes, map } from 'lodash';
import type { Conversation, FetchConversationsReturn, MailMessage } from '../types';

/**
 * Extracts all ids from conversations and messages
 * @param items conversations or messages
 * @returns array of ids
 */
export function extractIdsFromMessagesAndConversations(
	items: Record<string, Conversation> | Record<string, MailMessage> | undefined
): Array<string> {
	return Object.keys(items ?? []).reduce((acc: Array<string>, itemId) => {
		const item = items?.[itemId];
		item && acc.push(itemId);
		if (item && 'messages' in item) {
			acc.push(...item.messages.map((msg) => msg.id));
		}
		return acc;
	}, []);
}

/**
 * Extracts all ids from conversations and messages from fetchConversations payload
 * @param payload payload from fetchConversations
 * @returns array of ids
 */
export function extractIds(payload: FetchConversationsReturn | undefined): Array<string> {
	const ids = extractIdsFromMessagesAndConversations(payload?.conversations);
	ids.push(...extractIdsFromMessagesAndConversations(payload?.messages));
	return ids;
}

/**
 * Checks if all items are in search results ids
 * @param ids ids to check
 * @param searchResultsIds ids alread present in search results
 * @returns boolean
 */
export const isItemInSearches = ({
	ids,
	searchResultsIds
}: {
	ids: Array<string>;
	searchResultsIds: Array<string>;
}): boolean =>
	!includes(
		map(ids, (id) => searchResultsIds.includes(id)),
		false
	);
