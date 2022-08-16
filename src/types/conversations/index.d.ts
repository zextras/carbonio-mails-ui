/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ConvActionOperation } from '../soap/conv-action';

export type ConvMessage = {
	id: string;
	parent: string;
	date: number;
	isDraft?: boolean;
};

export type Conversation = {
	readonly id: string;
	date: number;
	msgCount: number;
	unreadMsgCount: number;
	messages: Array<ConvMessage>;
	participants: Participant[];
	subject: string;
	fragment: string;
	read: boolean;
	attachment: boolean;
	flagged: boolean;
	urgent: boolean;
	tags: string[];
	parent: string;
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
	sortBy?: 'dateDesc' | 'dateAsc';
	query?: string;
	offset?: undefined | number;
	recip?: '0' | '1' | '2';
	wantContent?: 'full' | 'original' | 'both';
};

export type FetchConversationsReturn = {
	conversations?: Record<string, Conversation>;
	messages?: Record<string, IncompleteMessage>;
	hasMore: boolean;
	types: string;
};
