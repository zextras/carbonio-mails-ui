/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Participant } from '../participant';
import { ConvActionOperation } from '../soap';

export type ConvMessage = {
	id: string;
	parent: string;
	date: number;
	isDraft?: boolean;
};

export type Conversation = {
	readonly id: string;
	date: number;
	messages: Array<ConvMessage>;
	participants: Participant[];
	subject: string;
	fragment: string;
	read: boolean;
	hasAttachment: boolean;
	flagged: boolean;
	urgent: boolean;
	tags: string[];
	parent: string;
	messagesInConversation: number;
	sortIndex: number;
};

export type ConvActionParameters = {
	ids: Array<string>;
	operation: ConvActionOperation;
	parent?: string;
	tagName?: string;
};

export type ConvActionResult = {
	ids: Array<string>;
	operation: ConvActionOperation;
};

export type FetchConversationsParameters = {
	folderId?: string;
	limit: number;
	before?: Date | null;
	types?: string;
	sortBy?: SortBy;
	query?: string;
	offset?: undefined | number;
	recip?: '0' | '1' | '2';
	wantContent?: 'full' | 'original' | 'both';
};

export type FetchConversationsReturn = {
	conversations?: Record<string, Conversation>;
	messages?: Record<string, IncompleteMessage>;
	hasMore: boolean;
	offset?: number;
	types: string;
	Detail: { Error: { Code: string; Message: string } };
};

export type DeleteAttachmentsReturn = {
	attachments: string[];
	res: SoapIncompleteMessage;
};
