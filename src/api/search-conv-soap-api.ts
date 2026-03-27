/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AccountSettings, getUserSettings } from '@zextras/carbonio-shell-ui';
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { map } from 'lodash';

import { MAIL_VERIFICATION_HEADERS } from 'constants/index';
import {
	SearchConvParameters,
	SearchConvRequest,
	SearchConvResponse
} from 'types/soap/search-conv';

export async function searchConvSoapApi({
	conversationId,
	fetch = 'all',
	folderId,
	shouldMarkAsRead,
	html
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
		html
	};
	if (folderId) {
		request.query = `inId: "${folderId}"`;
	}
	if (shouldMarkAsRead) {
		request.read = 1;
	}
	return legacySoapFetch<SearchConvRequest, SearchConvResponse>('SearchConv', request);
}
