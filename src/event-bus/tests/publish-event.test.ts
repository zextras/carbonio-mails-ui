/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { QuotaChangedEvent } from '../events/quota-changed';
import { publishEvent, publishQuotaChangedEvent } from '../publish-event';

describe('publishEvent', () => {
	it('should dispatch the event on window', () => {
		const listener = vi.fn();
		window.addEventListener(QuotaChangedEvent.EventName, listener);

		publishEvent(new QuotaChangedEvent());

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(expect.any(QuotaChangedEvent));

		window.removeEventListener(QuotaChangedEvent.EventName, listener);
	});
});

describe('publishQuotaChangedEvent', () => {
	it('should dispatch a QuotaChangedEvent when size is greater than 1MB', () => {
		const listener = vi.fn();
		window.addEventListener(QuotaChangedEvent.EventName, listener);

		publishQuotaChangedEvent(1024 * 1024 + 1);

		expect(listener).toHaveBeenCalledTimes(1);

		window.removeEventListener(QuotaChangedEvent.EventName, listener);
	});

	it('should not dispatch a QuotaChangedEvent when size is exactly 1MB', () => {
		const listener = vi.fn();
		window.addEventListener(QuotaChangedEvent.EventName, listener);

		publishQuotaChangedEvent(1024 * 1024);

		expect(listener).not.toHaveBeenCalled();

		window.removeEventListener(QuotaChangedEvent.EventName, listener);
	});

	it('should not dispatch a QuotaChangedEvent when size is less than 1MB', () => {
		const listener = vi.fn();
		window.addEventListener(QuotaChangedEvent.EventName, listener);

		publishQuotaChangedEvent(500000);

		expect(listener).not.toHaveBeenCalled();

		window.removeEventListener(QuotaChangedEvent.EventName, listener);
	});
});
