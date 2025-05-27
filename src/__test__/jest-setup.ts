/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import failOnConsole from 'jest-fail-on-console';
import { noop } from 'lodash';
import { setupServer, SetupServer } from 'msw/node';

import { getRestHandlers } from './mocks/network/msw/handlers';

let server: SetupServer;

/**
 * Returns the default configuration for jest failOnConsole setting
 */
export const getFailOnConsoleDefaultConfig = (): failOnConsole.InitOptions => ({
	shouldFailOnError: true,
	shouldFailOnWarn: true
});

/**
 * Default logic to execute before all the tests
 */
type DefaultBeforeAllTestsProps = {
	onUnhandledRequest: 'warn' | 'error';
};
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

	server?.close();

	server = setupServer(...getRestHandlers());
	server.listen({ onUnhandledRequest });
};

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
/**
 * Default logic to execute before each tests
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const defaultBeforeEachTest = (): void => {};

/**
 * Default logic to execute after each tests
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const defaultAfterEachTest = (): void => {
	jest.clearAllTimers();
};

/**
 * Default logic to execute after all the tests
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const defaultAfterAllTests = (): void => {
	server.resetHandlers();
	server.close();
};

export const getSetupServer = (): SetupServer => server;

window.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn()
}));
