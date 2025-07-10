/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as soapLib from '@zextras/carbonio-ui-soap-lib';

import { getSoapFetch } from '@test-utils/network/fetch';

export const useSync: jest.Mock<ReturnType<typeof soapLib.useSync>> = jest.fn();
export const useInfoRefresh: jest.Mock<ReturnType<typeof soapLib.useInfoRefresh>> = jest.fn();

const apiManagerInstance: Omit<soapLib.ApiManager, 'sessionInfo'> = {
	getSessionInfo: jest.fn(),
	setSessionInfo: jest.fn(),
	setPollingPreference: jest.fn(),
	resetPolling: jest.fn(),
	stopPolling: jest.fn()
};

export const ApiManager = {
	getApiManager: (): Omit<soapLib.ApiManager, 'sessionInfo'> => apiManagerInstance
};

export const legacyXmlSoapFetch: jest.Mock = jest.fn<
	ReturnType<typeof legacyXmlSoapFetch>,
	Parameters<typeof legacyXmlSoapFetch>
>();

export const legacySoapFetch = getSoapFetch('test-environment');
