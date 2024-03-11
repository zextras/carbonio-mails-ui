/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import '@testing-library/jest-dom';
import failOnConsole from 'jest-fail-on-console';
import { rest } from 'msw';

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

failOnConsole({
	...getFailOnConsoleDefaultConfig(),
	shouldFailOnWarn: false
});

beforeAll(() => {
	const h = rest.post('/service/soap/GetMsgRequest', handleGetMsgRequest);
	const j = rest.post('/service/soap/GetConvRequest', handleGetConvRequest);
	registerRestHandler(h);
	registerRestHandler(j);
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
