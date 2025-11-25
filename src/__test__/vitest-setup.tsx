/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { noop } from 'lodash';
import { SetupServer, setupServer } from 'msw/node';
import { vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';

import * as shell from './mocks/carbonio-shell-ui/carbonio-shell-ui';
import { getRestHandlers } from '@test-utils/network/msw/handlers';

vi.mock('@zextras/carbonio-shell-ui', () => shell);

// Setup MSW mock server
let server = setupServer();

configure({
	asyncUtilTimeout: 2000
});

/**
 * Default logic to execute before all the tests
 */
type DefaultBeforeAllTestsProps = {
	onUnhandledRequest: 'warn' | 'error';
};

const defaultBeforeAllTests = (
	{ onUnhandledRequest }: DefaultBeforeAllTestsProps = { onUnhandledRequest: 'warn' }
): void => {
	// Do not useFakeTimers with `whatwg-fetch` if using mocked server
	// https://github.com/mswjs/msw/issues/448

	server?.close();
	server = setupServer(...getRestHandlers());
	server.listen({ onUnhandledRequest });
};

beforeAll(() => {
	defaultBeforeAllTests();
});

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
	vi.clearAllTimers();
	vi.useRealTimers();
});

afterAll(() => {
	server.resetHandlers();
	server.close();
});

// mock a simplified crypto
Object.defineProperty(window.crypto, 'randomUUID', {
	writable: true,
	value: vi.fn(() => Math.random().toString())
});

Object.defineProperty(window.URL, 'createObjectURL', {
	writable: true,
	value: vi.fn()
});

// Mock Worker
class Worker {
	url: string;

	onmessage: (msg: string) => void;

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

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
	writable: true,
	value: function ResizeObserverMock(): ResizeObserver {
		return {
			observe: (): undefined => undefined,
			unobserve: (): undefined => undefined,
			disconnect: (): undefined => undefined
		};
	}
});

// mock a simplified Intersection Observer
Object.defineProperty(window, 'IntersectionObserver', {
	writable: true,
	value: vi.fn(function intersectionObserverMock(
		callback: IntersectionObserverCallback,
		options: IntersectionObserverInit
	) {
		return {
			thresholds: options.threshold,
			root: options.root,
			rootMargin: options.rootMargin,
			observe: vi.fn(),
			unobserve: vi.fn(),
			disconnect: vi.fn()
		};
	})
});

export const getSetupServer = (): SetupServer => server;
