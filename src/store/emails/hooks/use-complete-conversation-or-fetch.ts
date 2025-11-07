/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useMemo } from 'react';

import { debounce } from 'lodash';

import { DEFAULT_API_DEBOUNCE_TIME } from 'constants/index';
import { searchConvEmailStoreAction } from 'store/emails/actions/search-conv-action';
import { useConversationById, useConversationStatus } from 'store/emails/store';
import { NormalizedConversation, SearchRequestStatus } from 'types/index.d';

type ConversationWithStatus = {
	conversation: NormalizedConversation;
	conversationStatus: SearchRequestStatus;
};

/**
 * Provides a complete conversation with its status.
 * If the conversation is not in the store, it will be fetched.
 */
export function useCompleteConversationOrFetch(
	conversationId: string,
	folderId?: string
): ConversationWithStatus {
	const conversation = useConversationById(conversationId);
	const conversationStatus = useConversationStatus(conversationId);

	const requestDebouncedConversation = useMemo(
		() =>
			debounce(
				() => {
					if (conversation && !conversationStatus) {
						searchConvEmailStoreAction(conversationId, folderId);
					}
				},
				DEFAULT_API_DEBOUNCE_TIME,
				{ leading: false, trailing: true }
			),
		[conversation, conversationId, conversationStatus, folderId]
	);

	useEffect(() => {
		requestDebouncedConversation();
		return () => {
			requestDebouncedConversation.cancel();
		};
	}, [requestDebouncedConversation]);

	return {
		conversation,
		conversationStatus
	};
}
