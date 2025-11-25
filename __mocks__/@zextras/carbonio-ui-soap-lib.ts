/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as soapLib from '@zextras/carbonio-ui-soap-lib';

import { getSoapFetch } from '@test-utils/network/fetch';

export const useSync: Mock<ReturnType<typeof soapLib.useSync>> = vi.fn();
export const useInfoRefresh: Mock<ReturnType<typeof soapLib.useInfoRefresh>> = vi.fn();

const apiManagerInstance: Omit<soapLib.ApiManager, 'sessionInfo'> = {
	getSessionInfo: vi.fn(),
	setSessionInfo: vi.fn(),
	setPollingPreference: vi.fn(),
	resetPolling: vi.fn(),
	stopPolling: vi.fn()
};

export const ApiManager = {
	getApiManager: (): Omit<soapLib.ApiManager, 'sessionInfo'> => apiManagerInstance
};

export const legacyXmlSoapFetch: Mock = vi.fn<
	ReturnType<typeof legacyXmlSoapFetch>,
	Parameters<typeof legacyXmlSoapFetch>
>();

export const legacySoapFetch = getSoapFetch('test-environment');
