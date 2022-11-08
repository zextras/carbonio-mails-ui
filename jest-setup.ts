// /*
//  * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//  *
//  * SPDX-License-Identifier: AGPL-3.0-only
//  */
// import '@testing-library/jest-dom';
// import failOnConsole from 'jest-fail-on-console';
// import fetchMock from 'jest-fetch-mock';
// import server from './src/carbonio-ui-commons/test/mocks/network/msw/server';
//
// failOnConsole({
// 	shouldFailOnError: true,
// 	shouldFailOnWarn: true
// });
//
// beforeAll(() => {
// 	server.listen();
// 	fetchMock.doMock();
// });
//
// beforeEach(() => {});
//
// afterEach(() => {
// 	server.resetHandlers();
// });
//
// afterAll(() => {
// 	server.close();
// });
