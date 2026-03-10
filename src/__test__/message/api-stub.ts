/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { SearchRequest, SearchResponse } from 'types/soap/search';
import { SoapIncompleteMessage } from 'types/soap/soap-mail-message';

export const stubSearchMessages = ({
	messages
}: {
	messages: Array<SoapIncompleteMessage>;
}): Promise<SearchRequest> =>
	createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
		more: false,
		m: messages
	});
