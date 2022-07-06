/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type SoapEmailParticipantRole = 'f' | 't' | 'c' | 'b' | 'r' | 's' | 'n' | 'rf';

export type SoapMailParticipant = {
	/** Address */
	a: string;
	/** Display name */
	d?: string;
	/** Type:
	 * (f)rom,
	 * (t)o,
	 * (c)c,
	 * (b)cc,
	 * (r)eply-to,
	 * (s)ender,
	 * read-receipt (n)otification,
	 * (rf) resent-from
	 */
	p: string;
	t: SoapEmailParticipantRole;
	isGroup?: 0 | 1;
};
