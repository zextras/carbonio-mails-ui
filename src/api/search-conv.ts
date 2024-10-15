/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

import type { SearchConvRequest, SearchConvResponse } from '../types';

type SearchConvParameters = {
	conversationId: string;
	folderId?: string;
	fetch: string;
};

export async function searchConvSoapAPI({
	conversationId,
	fetch = 'all',
	folderId
}: SearchConvParameters): Promise<SearchConvResponse> {
	const request: SearchConvRequest = {
		_jsns: 'urn:zimbraMail',
		cid: conversationId,
		recip: '2',
		sortBy: 'dateDesc',
		offset: 0,
		fetch,
		max: 250_000,
		needExp: 1,
		limit: 250,
		html: 1
	};
	if (folderId) {
		request.query = `inId: "${folderId}"`;
	}
	return soapFetch<SearchConvRequest, SearchConvResponse>('SearchConv', request);
}
