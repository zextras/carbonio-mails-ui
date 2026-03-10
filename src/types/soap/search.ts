/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SoapConversation } from 'types/soap/soap-conversation';
import { SoapIncompleteMessage } from 'types/soap/soap-mail-message';
import { ZimbraRequest } from 'types/soap/zimbra-request';
import { SortBy } from 'types/sorting';

export type SearchRequest = ZimbraRequest & {
	sortBy: SortBy;
	types: string;
	fullConversation: 0 | 1;
	needExp: 0 | 1;
	recip: '0' | '1' | '2';
	offset?: number;
	limit: number;
	query: string;
	fetch?: string;
	wantContent?: string;
};

export type SearchResponse = {
	c?: SoapConversation[];
	m?: SoapIncompleteMessage[];
	more: boolean;
	offset?: number;
	sortBy?: SortBy;
};
