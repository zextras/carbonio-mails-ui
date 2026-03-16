/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IncompleteMessage } from 'types/messages';
import { Participant } from 'types/participant';
import { ConvActionOperation } from 'types/soap';
import { SortBy } from 'types/sorting';

export type ConvMessage = {
	id: string;
	parent: string;
	date: number;
	isDraft?: boolean;
};

export type NormalizedConversation = {
	readonly id: string;
	date: number;
	messageIds: Array<string>;
	participants: Participant[];
	subject: string;
	fragment: string;
	read: boolean;
	hasAttachment: boolean;
	flagged: boolean;
	urgent: boolean;
	tags: string[];
	messagesInConversation: number;
};

export type ConvActionParameters = {
	ids: Array<string>;
	operation: ConvActionOperation;
	parent?: string;
	tagName?: string;
};

export type SearchSoapApiParams = {
	folderId?: string;
	limit: number;
	before?: Date | null;
	types?: string;
	sortBy: SortBy;
	query?: string;
	offset?: number;
	recip?: '0' | '1' | '2';
	wantContent?: 'full' | 'original' | 'both';
	locale?: string;
	abortSignal?: AbortSignal;
};

export type FetchConversationsReturn = {
	conversations?: Record<string, NormalizedConversation>;
	messages?: Record<string, IncompleteMessage>;
	hasMore: boolean;
	offset?: number;
	types: string;
	Detail: { Error: { Code: string; Message: string } };
};
