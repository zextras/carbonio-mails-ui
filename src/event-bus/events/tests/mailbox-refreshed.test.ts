/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MailboxRefreshedEvent } from '../mailbox-refreshed';

describe('MailboxRefreshedEvent', () => {
	it('should create a CustomEvent with the correct event name', () => {
		const event = new MailboxRefreshedEvent();
		expect(event.type).toBe('carbonio:mails:eventbus:mailbox-refreshed');
	});

	it('should be an instance of CustomEvent', () => {
		const event = new MailboxRefreshedEvent();
		expect(event).toBeInstanceOf(CustomEvent);
	});
});
