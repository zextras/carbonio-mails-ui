/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { SearchRequest, SearchResponse } from 'types/soap/search';

/**
 * Searches the invites of the inbox which have not been answered yet.
 * The server sets the (r)eplied flag on an invite when the user responds to it
 */
export const searchPendingInvitesSoapApi = ({ limit = 50 }: { limit?: number } = {}): Promise<
	SearchResponse | ErrorSoapBodyResponse
> =>
	legacySoapFetch<SearchRequest, SearchResponse | ErrorSoapBodyResponse>('Search', {
		_jsns: 'urn:zimbraMail',
		limit,
		needExp: 0,
		recip: '0',
		fullConversation: 0,
		sortBy: 'dateDesc',
		types: 'message',
		query: `inId:"${FOLDERS.INBOX}" is:invite -is:replied`
	});
