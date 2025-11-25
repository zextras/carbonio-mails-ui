/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import '@testing-library/jest-dom';
import { noop } from 'lodash';
import { http } from 'msw';
import { setupServer, SetupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';

import { useLocalStorage } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { handleGetConvRequest } from '@test-utils/network/msw/handle-get-conv';
import { handleGetMsgRequest } from '@test-utils/network/msw/handle-get-msg';
import { getRestHandlers, registerRestHandler } from '@test-utils/network/msw/handlers';

let server: SetupServer;

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
	{ onUnhandledRequest }: { onUnhandledRequest: 'warn' | 'error' } = { onUnhandledRequest: 'warn' }
): void => {
	// mock a simplified IntersectionObserver
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

	server = setupServer(...getRestHandlers());
	server.listen({ onUnhandledRequest });
};

// ------------------ TEST LIFECYCLE ------------------

beforeAll(() => {
	// Register additional handlers
	const h = http.post('/service/soap/GetMsgRequest', handleGetMsgRequest);
	const j = http.post('/service/soap/GetConvRequest', handleGetConvRequest);
	registerRestHandler(h);
	registerRestHandler(j);

	defaultBeforeAllTests({ onUnhandledRequest: 'error' });

	// Mock localStorage hooks
	useLocalStorage.mockReturnValue([vi.fn(), vi.fn()]);
});

afterEach(() => {
	vi.clearAllTimers();
	vi.clearAllMocks();
});

afterAll(() => {
	server.resetHandlers();
	server.close();
});

// ------------------ GLOBAL MOCKS ------------------

// matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn()
	}))
});

// window.open
Object.defineProperty(window, 'open', {
	writable: true,
	value: vi.fn()
});

// crypto.randomUUID
Object.defineProperty(window.crypto, 'randomUUID', {
	writable: true,
	value: vi.fn(() => Math.random().toString())
});

// Worker mock
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

// ResizeObserver mock
window.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// ------------------ EXPORTS ------------------
export const getSetupServer = (): SetupServer => server;
