/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { GetConvRequest, GetConvResponse } from 'types/soap/get-conv';
import { SearchRequest, SearchResponse } from 'types/soap/search';
import { SearchConvRequest, SearchConvResponse } from 'types/soap/search-conv';
import { SoapConversation } from 'types/soap/soap-conversation';

export const stubSearchConversations = ({
	conversations
}: {
	conversations: Array<SoapConversation>;
}): Promise<SearchRequest> =>
	createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
		more: false,
		c: conversations
	});

export const stubSearchConversation = ({
	conversation
}: {
	conversation: SoapConversation;
}): Promise<SearchConvRequest> =>
	createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', {
		m: conversation.m,
		more: false,
		offset: '',
		orderBy: ''
	});

export const stubGetConversation = ({
	conversation
}: {
	conversation: SoapConversation;
}): Promise<GetConvRequest> =>
	createSoapAPIInterceptor<GetConvRequest, GetConvResponse>('GetConv', {
		c: [conversation]
	});
