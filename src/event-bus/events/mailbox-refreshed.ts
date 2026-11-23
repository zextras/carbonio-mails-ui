/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class MailboxRefreshedEvent extends CustomEvent<undefined> {
	static readonly EventName = 'carbonio:mails:eventbus:mailbox-refreshed';

	constructor() {
		super(MailboxRefreshedEvent.EventName);
	}
}
