/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Participant } from './participant';

export type ConvMessage = {
	id: string;
	parent: string;
	// date: number; TODO: reintroduce after test
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
