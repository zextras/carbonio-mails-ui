/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SoapConversation } from './soap-conversation';
import { SoapIncompleteMessage } from './soap-mail-message';
import { ZimbraRequest } from './zimbra-request';

export type SearchRequest = ZimbraRequest & {
	sortBy: 'dateDesc' | 'dateAsc';
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
	sortBy?: string;
};
