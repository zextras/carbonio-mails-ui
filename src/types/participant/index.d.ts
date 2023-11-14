/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ParticipantRoleType } from '../../carbonio-ui-commons/constants/participants';

export type Participant = {
	type: ParticipantRoleType;
	address: string;
	name?: string;
	fullName?: string;
	email?: string;
	error?: boolean;
	exp?: boolean;
	isGroup?: boolean;
};

export type SharedParticipant = {
	type: string;
	email: string;
	company: string;
	firstName: string;
	fullName: string;
	lastName: string;
};
