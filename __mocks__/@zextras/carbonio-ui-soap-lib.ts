/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getSoapFetch } from '@test-utils/network/fetch';

export const useSync = vi.fn();
export const useInfoRefresh = vi.fn();

const apiManagerInstance = {
	getSessionInfo: vi.fn(),
	setSessionInfo: vi.fn(),
	setPollingPreference: vi.fn(),
	resetPolling: vi.fn(),
	stopPolling: vi.fn()
};

export const ApiManager = {
	getApiManager: vi.fn(() => apiManagerInstance)
};

export const legacyXmlSoapFetch = vi.fn();

export const legacySoapFetch = getSoapFetch('test-environment');
