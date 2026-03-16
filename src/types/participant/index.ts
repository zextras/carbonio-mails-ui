/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ParticipantRoleType } from '@zextras/carbonio-ui-commons';

import {
	type ParticipantAddress,
	type ParticipantDisplayName,
	type ParticipantExpandGroupAllowed,
	type ParticipantIsGroup,
	type ParticipantName
} from '../soap';

export type Participant = {
	type: ParticipantRoleType;
	address: ParticipantAddress;
	name?: ParticipantDisplayName | ParticipantAddress;
	fullName?: ParticipantName;
	email?: ParticipantAddress;
	error?: boolean;
	exp?: ParticipantExpandGroupAllowed;
	isGroup?: ParticipantIsGroup;
};

export type SharedParticipant = {
	type: string;
	email: string;
	company: string;
	firstName: string;
	fullName: string;
	lastName: string;
};
