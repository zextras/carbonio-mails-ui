/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect } from 'react';

import { type ErrorSoapBodyResponse, getTags, Tags } from '@zextras/carbonio-shell-ui';
import produce from 'immer';
import { map } from 'lodash';

import { searchConvSoapAPI } from '../../../../api/search-conv';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeConversation } from '../../../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import {
	IncompleteMessage,
	MailMessage,
	NormalizedConversation,
	SearchConvResponse,
	SearchRequestStatus,
	SearchResponse
} from '../../../../types';
import {
	type MessageStoreState,
	useConversationById,
	useMessageStore
} from '../../message-store/store';

function updateMessages(messages: Array<MailMessage | IncompleteMessage>, offset: number): void {
	useMessageStore.setState((state: MessageStoreState) => ({
		search: {
			...state.search,
			status: API_REQUEST_STATUS.fulfilled,
			messageIds: new Set(messages.map((c) => c.id))
		},
		populatedItems: {
			...state.populatedItems,
			offset,
			messages: messages.reduce(
				(acc, msg) => {
					// eslint-disable-next-line no-param-reassign
					acc[msg.id] = msg;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			)
		}
	}));
}
function updateConversationMessages(conversationId: string, messages: IncompleteMessage[]): void {
	useMessageStore.setState(
		produce(({ populatedItems }) => {
			populatedItems.conversations[conversationId].messages = messages;
			populatedItems.conversationsStatus[conversationId] = API_REQUEST_STATUS.fulfilled;
			populatedItems.messages = messages.reduce(
				(acc, msg) => {
					acc[msg.id] = msg;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			);
		})
	);
}
function updateConversations(conversations: Array<NormalizedConversation>, offset: number): void {
	useMessageStore.setState((state: MessageStoreState) => ({
		search: {
			...state.search,
			status: API_REQUEST_STATUS.fulfilled,
			conversationIds: new Set(conversations.map((c) => c.id))
		},
		populatedItems: {
			...state.populatedItems,
			offset,
			conversations: conversations.reduce(
				(acc, conv) => {
					// eslint-disable-next-line no-param-reassign
					acc[conv.id] = conv;
					return acc;
				},
				{} as Record<string, NormalizedConversation>
			)
		}
	}));
}

export function updateConversationStatus(
	conversationId: string,
	status: SearchRequestStatus
): void {
	useMessageStore.setState(
		produce(({ populatedItems }) => {
			populatedItems.conversationsStatus[conversationId] = status;
		})
	);
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
	updateConversations(conversations, offset);
}

function handleFulFilledMessagesResults({
	searchResponse,
	offset
}: {
	searchResponse: SearchResponse;
	offset: number;
}): void {
	const normalizedMessages = map(searchResponse.m, (msg) =>
		normalizeMailMessageFromSoap(msg, false)
	);

	updateMessages(normalizedMessages, offset);
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

export function handleSearchConvResponse(
	conversationId: string,
	response: SearchConvResponse
): void {
	const messages = map(response?.m ?? [], (msg) => normalizeMailMessageFromSoap(msg, true));
	updateConversationMessages(conversationId, messages);
}

type ConversationWithStatus = {
	conversation: NormalizedConversation;
	conversationStatus: SearchRequestStatus;
};

export function useConversationStatus(id: string): SearchRequestStatus {
	return useMessageStore((state) => state.populatedItems.conversationsStatus?.[id]);
}

export function useCompleteConversation(
	conversationId: string,
	folderId: string
): ConversationWithStatus {
	const conversation = useConversationById(conversationId);
	const conversationStatus = useConversationStatus(conversationId);
	useEffect(() => {
		if (!conversationStatus) {
			updateConversationStatus(conversationId, API_REQUEST_STATUS.pending);
			searchConvSoapAPI({ conversationId, fetch: 'all', folderId })
				.then((response) => {
					if ('Fault' in response) {
						updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
						return;
					}
					handleSearchConvResponse(conversationId, response);
				})
				.catch(() => {
					updateConversationStatus(conversationId, API_REQUEST_STATUS.error);
				});
		}
	}, [conversationId, conversationStatus, folderId]);
	return {
		conversation,
		conversationStatus
	};
}
