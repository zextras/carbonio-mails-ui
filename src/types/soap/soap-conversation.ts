/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SoapMailMessage } from './soap-mail-message';
import { SoapMailParticipant } from './soap-mail-participant';

export type SoapConversation = {
	readonly id: string;
	/** Number of the messages */
	n: number;
	/** Number of the unread messages */
	u: number;
	/** Flags */
	f: string;
	/** Tag names (comma separated) */
	tn: string;
	/** Tag ids (comma separated) */
	t?: string;
	/** Date (of the most recent message) */
	d: number;
	/** Messages */
	m: SoapMailMessage[];
	/** Email information for conversation participants */
	e: SoapMailParticipant[];
	/** Subject */
	su: string;
	/** Fragment */
	fr: string;
};
