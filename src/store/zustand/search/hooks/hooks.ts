/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type ErrorSoapBodyResponse, getTags, Tags } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useEffect } from 'react';

import { searchConvSoapAPI } from '../../../../api/search-conv';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeConversation } from '../../../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { SearchConvResponse, SearchRequestStatus, SearchResponse } from '../../../../types';
import {
	messageStoreActions,
	setConversationStatus,
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
	messageStoreActions.updateConversations(conversations, offset);
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

	messageStoreActions.updateMessages(normalizedMessages, offset);
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
	messageStoreActions.updateConversationMessages(conversationId, messages);
}

export function useLoadConversation(conversationId: string, folderId: string): void {
	const conversationStatus = useConversationStatus(conversationId);
	useEffect(() => {
		if (!conversationStatus) {
			setConversationStatus(conversationId, API_REQUEST_STATUS.pending);
			searchConvSoapAPI({ conversationId, fetch: 'all', folderId })
				.then((response) => {
					if ('Fault' in response) {
						setConversationStatus(conversationId, API_REQUEST_STATUS.error);
						return;
					}
					handleSearchConvResponse(conversationId, response);
					setConversationStatus(conversationId, API_REQUEST_STATUS.fulfilled);
				})
				.catch(() => {
					setConversationStatus(conversationId, API_REQUEST_STATUS.error);
				});
		}
	}, [conversationId, conversationStatus, folderId]);
}
