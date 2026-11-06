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
	types: 'conversation' | 'message';
	fullConversation: 0 | 1;
	recip: '0' | '1' | '2';
	offset?: number;
	limit: number;
	query: string;
	locale?: { _content: string };
};

// A message of a conversation hit: the server sends only these fields, numbers as strings, s only in a
// conversation of one message, f only when set (ConversationMsgHitInfo, SearchResponse.doConvMsgHit)
export type SearchConvMsgHit = {
	readonly id: string;
	l: string;
	f?: string;
	d: string;
	s?: string;
	autoSendTime?: string;
};

export type SearchConversationHit = Omit<SoapConversation, 'm'> & {
	m?: Array<SearchConvMsgHit>;
	/** Sort field */
	sf?: string;
};

// A message hit is a summary: never its parts, headers, message id or send date (ToXML.encodeMessageSummary)
export type SearchMessageHit = Omit<SoapIncompleteMessage, 'mp' | '_attrs' | 'mid' | 'sd'> & {
	/** Matched the query (fullConversation) */
	cm?: boolean;
	/** Sort field */
	sf?: string;
};

export type SearchResponse = {
	c?: SearchConversationHit[];
	m?: SearchMessageHit[];
	more: boolean;
	offset?: number;
	sortBy?: SortBy;
};
