/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserAccount } from '@zextras/carbonio-shell-ui';
import { includes, map } from 'lodash';

import { FetchConversationsReturn, NormalizedConversation } from 'types/conversations';
import { MailMessage } from 'types/messages';

/**
 * Extracts all ids from conversations and messages
 * @param items conversations or messages
 * @returns array of ids
 */
export function extractIdsFromMessagesAndConversations(
	items: Record<string, NormalizedConversation> | Record<string, MailMessage> | undefined
): Array<string> {
	return Object.keys(items ?? []).reduce((acc: Array<string>, itemId) => {
		const item = items?.[itemId];
		item && acc.push(itemId);
		if (item && 'messageIds' in item) {
			acc.push(...item.messageIds);
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

export function getCompleteMessageId(messageId: string | undefined): string | undefined {
	if (!messageId) return undefined;

	if (!messageId?.includes(':')) {
		const loggedInAccountId = getUserAccount()?.id;
		if (!loggedInAccountId) return messageId;
		return `${loggedInAccountId}:${messageId}`;
	}

	return messageId;
}
