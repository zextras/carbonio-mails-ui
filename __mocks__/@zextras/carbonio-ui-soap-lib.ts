/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type {
	useSync as syncType,
	useInfoRefresh as infoRefresh,
	ApiManager as ApiManagerType
} from '@zextras/carbonio-ui-soap-lib';
import type { Mock } from 'vitest';

export const useSync: Mock<typeof syncType> = vi.fn();
export const useInfoRefresh: Mock<typeof infoRefresh> = vi.fn();

const apiManagerInstance: Omit<ApiManagerType, 'sessionInfo'> = {
	getSessionInfo: vi.fn(),
	setSessionInfo: vi.fn(),
	setPollingPreference: vi.fn(),
	resetPolling: vi.fn(),
	stopPolling: vi.fn()
};

export const ApiManager = {
	getApiManager: (): Omit<ApiManagerType, 'sessionInfo'> => apiManagerInstance
};

// export const legacyXmlSoapFetch = vi.fn();

// export const legacySoapFetch = getSoapFetch('test-environment');
