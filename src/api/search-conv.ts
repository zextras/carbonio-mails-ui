/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

import type { SearchConvRequest, SearchConvResponse } from '../types';

type SearchConvParameters = {
	conversationId: string;
	folderId: string;
	fetch: string;
};

export async function searchConvSoapAPI({
	conversationId,
	folderId,
	fetch = 'all'
}: SearchConvParameters): Promise<SearchConvResponse> {
	return soapFetch<SearchConvRequest, SearchConvResponse>('SearchConv', {
		_jsns: 'urn:zimbraMail',
		cid: conversationId,
		query: `inId: "${folderId}"`,
		recip: '2',
		sortBy: 'dateDesc',
		offset: 0,
		fetch,
		needExp: 1,
		limit: 250,
		html: 1
	});
}
