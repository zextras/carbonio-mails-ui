/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { getIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { type Mock } from 'vitest';

import { QuotaChangedEvent } from '../../../event-bus/events/quota-changed';
import { QuotaRefreshHandler } from '../quota-refresh-handler';
import { setupTest } from '@test-setup';

describe('QuotaRefreshHandler', () => {
	it('should call storages-refresh-quota when a QuotaChangedEvent is dispatched', () => {
		const refreshQuotaFn = vi.fn();
		(getIntegratedFunction as Mock).mockReturnValue([refreshQuotaFn, true]);

		setupTest(<QuotaRefreshHandler />);

		window.dispatchEvent(new QuotaChangedEvent());

		expect(getIntegratedFunction).toHaveBeenCalledWith('storages-refresh-quota');
		expect(refreshQuotaFn).toHaveBeenCalledTimes(1);
	});

	it('should not throw when storages-refresh-quota is not available', () => {
		(getIntegratedFunction as Mock).mockReturnValue([vi.fn(), false]);

		setupTest(<QuotaRefreshHandler />);

		expect(() => {
			window.dispatchEvent(new QuotaChangedEvent());
		}).not.toThrow();
	});

	it('should stop listening when unmounted', () => {
		const refreshQuotaFn = vi.fn();
		(getIntegratedFunction as Mock).mockReturnValue([refreshQuotaFn, true]);

		const { unmount } = setupTest(<QuotaRefreshHandler />);
		unmount();

		window.dispatchEvent(new QuotaChangedEvent());

		expect(refreshQuotaFn).not.toHaveBeenCalled();
	});
});
