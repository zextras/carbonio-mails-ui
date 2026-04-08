/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { QuotaChangedEvent } from '../quota-changed';

describe('QuotaChangedEvent', () => {
	it('should create a CustomEvent with the correct event name', () => {
		const event = new QuotaChangedEvent();
		expect(event.type).toBe('carbonio:mails:eventbus:quota-changed');
	});

	it('should be an instance of CustomEvent', () => {
		const event = new QuotaChangedEvent();
		expect(event).toBeInstanceOf(CustomEvent);
	});
});
