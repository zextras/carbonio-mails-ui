/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// the loaded conversations shown right now (in the reading panel or expanded in a list),
// with how many views show each of them
const shownConversations = new Map<string, number>();

/**
 * Records that a view shows the conversation, until the returned function is called.
 */
export function showConversation(conversationId: string): () => void {
	shownConversations.set(conversationId, (shownConversations.get(conversationId) ?? 0) + 1);
	return () => {
		const views = (shownConversations.get(conversationId) ?? 1) - 1;
		if (views > 0) {
			shownConversations.set(conversationId, views);
		} else {
			shownConversations.delete(conversationId);
		}
	};
}

export function isConversationShown(conversationId: string): boolean {
	return shownConversations.has(conversationId);
}

export function getShownConversationIds(): Set<string> {
	return new Set(shownConversations.keys());
}
