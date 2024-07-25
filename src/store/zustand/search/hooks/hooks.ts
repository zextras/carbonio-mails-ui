/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect } from 'react';

import { type ErrorSoapBodyResponse, getTags, Tags } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { searchConvSoapAPI } from '../../../../api/search-conv';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeConversation } from '../../../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import {
	NormalizedConversation,
	SearchConvResponse,
	SearchRequestStatus,
	SearchResponse
} from '../../../../types';
import {
	updateConversationMessages,
	updateConversations,
	updateConversationStatus,
	updateMessages,
	useConversationById,
	useConversationStatus
} from '../../message-store/store';

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

export function useCompleteConversation(
	conversationId: string,
	folderId: string
): ConversationWithStatus {
	const conversation = useConversationById(conversationId);
	const conversationStatus = useConversationStatus(conversationId);
	useEffect(() => {
		if (conversation && !conversationStatus) {
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
	}, [conversation, conversationId, conversationStatus, folderId]);
	return {
		conversation,
		conversationStatus
	};
}
