/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SearchRequest, SearchResponse, SoapIncompleteMessage } from '../../types';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';

export const stubSearchMessages = ({
	messages
}: {
	messages: Array<SoapIncompleteMessage>;
}): Promise<SearchRequest> =>
	createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
		more: false,
		m: messages
	});
