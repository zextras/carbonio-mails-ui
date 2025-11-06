/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useMemo, useRef } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';

import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from 'constants/index';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
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
	const settings = useUserSettings();
	const prefMarkMsgRead = settings?.prefs?.zimbraPrefMarkMsgRead !== '-1';
	const prevConversationIdRef = useRef<string | null>(null);
	const hasNavigated = prevConversationIdRef.current !== conversationId;

	const requestDebouncedConversation = useMemo(
		() =>
			debounce(
				() => {
					if (conversation && !conversationStatus) {
						const shouldMarkAsRead = !conversation.read && prefMarkMsgRead;
						searchConvEmailStoreAction(conversationId, folderId, shouldMarkAsRead);
					} else if (
						hasNavigated &&
						conversation &&
						!conversation.read &&
						conversationStatus === API_REQUEST_STATUS.fulfilled &&
						prefMarkMsgRead
					) {
						convActionEmailStoreAction({
							operation: 'read',
							ids: [conversationId]
						});
					}
					prevConversationIdRef.current = conversationId;
				},
				DEFAULT_API_DEBOUNCE_TIME,
				{ leading: false, trailing: true }
			),
		[conversation, conversationId, conversationStatus, folderId, prefMarkMsgRead, hasNavigated]
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
