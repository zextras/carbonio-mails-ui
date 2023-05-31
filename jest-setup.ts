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
import { handleGetMsgRequest } from './src/tests/mocks/network/msw/handle-get-msg';

failOnConsole({
	...getFailOnConsoleDefaultConfig(),
	shouldFailOnWarn: false
});

beforeAll(() => {
	const h = [
		rest.post('/service/soap/GetMsgRequest', handleGetMsgRequest),
		rest.post('*/service/soap/BatchRequest', async (req, res, ctx) => {
			// if (!req) {
			// 	reject(new Error('Empty request'));
			// }

			// const action = req.body;
			console.log(await req.text());

			// Don't care about the actual response
			return res(ctx.json({}));
		})
	];
	registerRestHandler(...h);
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
