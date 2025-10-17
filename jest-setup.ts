/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import '@testing-library/jest-dom';

import { matchers } from '@emotion/jest';
import failOnConsole from 'jest-fail-on-console';
import fetchMock from 'jest-fetch-mock';
import { noop } from 'lodash';
import { http } from 'msw';
import { SetupServer, setupServer } from 'msw/node';

import { useLocalStorage } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { handleGetConvRequest } from '@test-utils/network/msw/handle-get-conv';
import { handleGetMsgRequest } from '@test-utils/network/msw/handle-get-msg';
import { getRestHandlers, registerRestHandler } from '@test-utils/network/msw/handlers';

let server: SetupServer;

failOnConsole({
	shouldFailOnError: true,
	shouldFailOnWarn: true,
	silenceMessage: (message) =>
		message.includes('React does not recognize the `isGeneric` prop on a DOM element') ||
		message.includes('React does not recognize the `isQueryFilter` prop on a DOM element') ||
		message.includes('React does not recognize the `searchString` prop on a DOM element')
});

/**
 * Default logic to execute before all the tests
 */
type DefaultBeforeAllTestsProps = {
	onUnhandledRequest: 'warn' | 'error';
};

// Inject custom matchers for Jest
expect.extend(matchers);

// Global test mocks
declare global {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const BASE_PATH: string;
}

// Set up BASE_PATH mock for TinyMCE asset loading in tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).BASE_PATH = '/test-base-path/';

export const defaultBeforeAllTests = (
	{ onUnhandledRequest }: DefaultBeforeAllTestsProps = { onUnhandledRequest: 'warn' }
): void => {
	// Do not useFakeTimers with `whatwg-fetch` if using mocked server
	// https://github.com/mswjs/msw/issues/448

	// mock a simplified Intersection Observer
	Object.defineProperty(window, 'IntersectionObserver', {
		writable: true,
		value: jest.fn(function intersectionObserverMock(
			callback: IntersectionObserverCallback,
			options: IntersectionObserverInit
		) {
			return {
				thresholds: options.threshold,
				root: options.root,
				rootMargin: options.rootMargin,
				observe: jest.fn(),
				unobserve: jest.fn(),
				disconnect: jest.fn()
			};
		})
	});

	server = setupServer(...getRestHandlers());
	server.listen({ onUnhandledRequest });
};

beforeAll(() => {
	fetchMock.doMock();
	const h = http.post('/service/soap/GetMsgRequest', handleGetMsgRequest);
	const j = http.post('/service/soap/GetConvRequest', handleGetConvRequest);
	registerRestHandler(h);
	registerRestHandler(j);
	defaultBeforeAllTests({ onUnhandledRequest: 'error' });
	useLocalStorage.mockReturnValue([jest.fn(), jest.fn()]);
});

afterEach(() => {
	jest.clearAllTimers();
});

afterAll(() => {
	server.resetHandlers();
	server.close();
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

export const getSetupServer = (): SetupServer => server;

window.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn()
}));
