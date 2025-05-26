/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import '@testing-library/jest-dom';
import {
	defaultAfterAllTests,
	defaultAfterEachTest,
	defaultBeforeAllTests,
	defaultBeforeEachTest,
	getFailOnConsoleDefaultConfig,
	registerRestHandler,
	useLocalStorage
} from '@zextras/carbonio-ui-commons';
import failOnConsole from 'jest-fail-on-console';
import fetchMock from 'jest-fetch-mock';
import { noop } from 'lodash';
import { http } from 'msw';

import { handleGetConvRequest } from './src/tests/mocks/network/msw/handle-get-conv';
import { handleGetMsgRequest } from './src/tests/mocks/network/msw/handle-get-msg';

failOnConsole({
	...getFailOnConsoleDefaultConfig(),
	silenceMessage: (message) =>
		message.includes('React does not recognize the `isGeneric` prop on a DOM element')
});

beforeAll(() => {
	fetchMock.doMock();
	const h = http.post('/service/soap/GetMsgRequest', handleGetMsgRequest);
	const j = http.post('/service/soap/GetConvRequest', handleGetConvRequest);
	registerRestHandler(h);
	registerRestHandler(j);
	defaultBeforeAllTests();
	useLocalStorage.mockReturnValue([jest.fn(), jest.fn()]);
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

// Mock matchMedia
// see: https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // deprecated
		removeListener: jest.fn(), // deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn()
	}))
});

// Mock implementation of window.open
Object.defineProperty(window, 'open', {
	writable: true,
	value: jest.fn()
});

// mock a simplified crypto
Object.defineProperty(window.crypto, 'randomUUID', {
	writable: true,
	value: jest.fn(() => Math.random().toString())
});

/**
 * Mocks the Worker class
 */

type MessageHandler = (msg: string) => void;

class Worker {
	url: string;

	onmessage: MessageHandler;

	constructor(stringUrl: string) {
		this.url = stringUrl;
		this.onmessage = noop;
	}

	postMessage(msg: string): void {
		this.onmessage(msg);
	}
}

Object.defineProperty(window, 'Worker', {
	writable: true,
	value: Worker
});

window.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn()
}));
