/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { QuotaChangedEvent } from './events/quota-changed';
import { EventsBusEvents } from './types';

const ONE_MB = 1024 * 1024;

export const publishEvent = (event: EventsBusEvents): void => {
	window.dispatchEvent(event);
};

export const publishQuotaChangedEvent = (sizeInBytes: number): void => {
	if (sizeInBytes > ONE_MB) {
		publishEvent(new QuotaChangedEvent());
	}
};
