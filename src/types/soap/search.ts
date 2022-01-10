/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SoapConversation } from './soap-conversation';
import { ZimbraRequest } from './zimbra-request';

export type SearchRequest = ZimbraRequest & {
	sortBy?: 'dateDesc';
	types: 'conversation';
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
	c: SoapConversation[];
	more: boolean;
	offset?: number;
	sortBy?: string;
};
