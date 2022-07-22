/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// import { ParticipantRole } from '../../commons/utils';

export type Participant = {
	type: string;
	address: string;
	name?: string;
	fullName?: string;
};

export type SharedParticipant = {
	type: string;
	email: string;
	company: string;
	firstName: string;
	fullName: string;
	lastName: string;
};
