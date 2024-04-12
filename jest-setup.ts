/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import '@testing-library/jest-dom';
import failOnConsole from 'jest-fail-on-console';
import fetchMock from 'jest-fetch-mock';
import { http } from 'msw';

import {
	defaultAfterAllTests,
	defaultAfterEachTest,
	defaultBeforeAllTests,
	defaultBeforeEachTest,
	getFailOnConsoleDefaultConfig
} from './src/carbonio-ui-commons/test/jest-setup';
import { registerRestHandler } from './src/carbonio-ui-commons/test/mocks/network/msw/handlers';
import { handleGetConvRequest } from './src/tests/mocks/network/msw/handle-get-conv';
import { handleGetMsgRequest } from './src/tests/mocks/network/msw/handle-get-msg';
import { handleUndeleteAPIRequest } from './src/tests/mocks/network/msw/handle-undelete';

failOnConsole({
	...getFailOnConsoleDefaultConfig(),
	shouldFailOnWarn: false
});

beforeAll(() => {
	fetchMock.doMock();
	const h = http.post('/service/soap/GetMsgRequest', handleGetMsgRequest);
	const j = http.post('/service/soap/GetConvRequest', handleGetConvRequest);
	const k = http.post('/zx/backup/v1/undelete', handleUndeleteAPIRequest);
	registerRestHandler(h);
	registerRestHandler(j);
	registerRestHandler(k);
	defaultBeforeAllTests();
});

beforeEach(() => {
	defaultBeforeEachTest();
});

afterEach(() => {
	defaultAfterEachTest();
});

afterAll(() => {
	defaultAfterAllTests();
});
