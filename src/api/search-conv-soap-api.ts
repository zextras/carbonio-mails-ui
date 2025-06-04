/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AccountSettings, getUserSettings, soapFetch } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { MAIL_VERIFICATION_HEADERS } from 'constants/index';
import type { SearchConvRequest, SearchConvResponse } from 'types/index.d';

type SearchConvParameters = {
	conversationId: string;
	folderId?: string;
	fetch: string;
};

export async function searchConvSoapApi({
	conversationId,
	fetch = 'all',
	folderId
}: SearchConvParameters): Promise<SearchConvResponse> {
	const userSettings: AccountSettings = getUserSettings();
	const sortBy = userSettings.prefs.zimbraPrefConversationOrder as 'dateDesc' | 'dateAsc';
	const request: SearchConvRequest = {
		_jsns: 'urn:zimbraMail',
		cid: conversationId,
		recip: '2',
		sortBy,
		offset: 0,
		fetch,
		max: 250_000,
		header: map(MAIL_VERIFICATION_HEADERS, (header) => ({ n: header })),
		needExp: 1,
		limit: 250,
		html: 1
	};
	if (folderId) {
		request.query = `inId: "${folderId}"`;
	}
	return soapFetch<SearchConvRequest, SearchConvResponse>('SearchConv', request);
}
