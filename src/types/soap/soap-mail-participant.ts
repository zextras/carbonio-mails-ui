/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ParticipantRoleType } from '@zextras/carbonio-ui-commons';

export type ParticipantAddress = string;
export type ParticipantDisplayName = string;
export type ParticipantName = string;
export type ParticipantIsGroup = boolean;
export type ParticipantExpandGroupAllowed = boolean;

export type SoapMailParticipant = {
	/**
	 * The email address of the participant.
	 * This is a required field.
	 */
	a: ParticipantAddress;

	/**
	 * The display name of the participant.
	 * This is an optional field. If not provided, the email client may display only the email address.
	 */
	d?: ParticipantDisplayName;

	/**
	 * The personal name of the participant.
	 * This is a required field.
	 */
	p: ParticipantName;

	/**
	 * The role of the participant in the email.
	 * Possible values are:
	 * - (f)rom: Sender of the email.
	 * - (t)o: Primary recipient of the email.
	 * - (c)c: Carbon copy recipient.
	 * - (b)cc: Blind carbon copy recipient.
	 * - (r)eply-to: Address to which replies should be sent.
	 * - (s)ender: The actual sender of the email (if different from the "from" address).
	 * - (n)otification: Read receipt notification.
	 * - (rf) resent-from: Resent from address.
	 */
	t: ParticipantRoleType;

	/**
	 * Indicates whether the participant is a group (e.g., a mailing list).
	 * This is an optional field.
	 */
	isGroup?: ParticipantIsGroup;

	/**
	 * Flags whether the authenticated user can expand group members.
	 * - 1 (true): The authenticated user has permission to expand members in this group.
	 * - 0 (false): The authenticated user does not have permission to expand group members.
	 * Note: This field is present only when {isGroup} is set to `true`.
	 */
	exp?: ParticipantExpandGroupAllowed;
};
