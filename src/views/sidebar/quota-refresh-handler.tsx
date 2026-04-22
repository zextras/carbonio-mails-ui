/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { getIntegratedFunction } from '@zextras/carbonio-shell-ui';

import { QuotaChangedEvent } from '../../event-bus/events/quota-changed';

export const QuotaRefreshHandler = (): null => {
	useEffect(() => {
		const handler = (): void => {
			const [refreshQuota, isAvailable] = getIntegratedFunction('storages-refresh-quota');
			if (isAvailable) {
				refreshQuota();
			}
		};

		window.addEventListener(QuotaChangedEvent.EventName, handler);
		return () => {
			window.removeEventListener(QuotaChangedEvent.EventName, handler);
		};
	}, []);

	return null;
};
