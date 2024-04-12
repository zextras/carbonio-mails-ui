/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type MatchingReplyIdentity = {
	address: string;
	name: string;
	identityId: string | undefined;
	identityName: string | undefined;
	defaultSignatureId?: string;
	forwardReplySignatureId?: string;
};

export type CalendarType = {
	id: string;
	name?: string;
	rgb?: string;
	color?: number;
	owner?: string;
};

export type Attendee = {
	email: string;
};

export type SenderType = {
	address: string;
	fullName: string;
	identityName: string;
	label: string;
};
