/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// eslint-disable-next-line no-shadow
export enum ParticipantRole {
	FROM = 'f',
	TO = 't',
	CARBON_COPY = 'c',
	BLIND_CARBON_COPY = 'b',
	REPLY_TO = 'r',
	SENDER = 's',
	READ_RECEIPT_NOTIFICATION = 'n',
	RESENT_FROM = 'rf'
}

// eslint-disable-next-line no-shadow
export enum ActionsType {
	NEW = 'new',
	EDIT_AS_DRAFT = 'editAsDraft',
	EDIT_AS_NEW = 'editAsNew',
	REPLY = 'reply',
	REPLY_ALL = 'replyAll',
	FORWARD = 'forward',
	MAIL_TO = 'mailTo',
	COMPOSE = 'compose',
	PREFILL_COMPOSE = 'prefillCompose'
}

export type Participant = {
	type: ParticipantRole;
	address: string;
	name?: string;
	fullName?: string;
};

export type SharedParticipant = {
	type: ParticipantRole;
	email: string;
	company: string;
	firstName: string;
	fullName: string;
	lastName: string;
};
