/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import '@testing-library/jest-dom';
import { matchers } from '@emotion/jest';
import { http } from 'msw';
import { setupServer, SetupServer } from 'msw/node';
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import { useEditorsStore } from '../store/editor';
import { getUseEmailStoreAndHooksForTesting } from '../store/emails/store';
import { useLocalStorage } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { handleGetConvRequest } from '@test-utils/network/msw/handle-get-conv';
import { handleGetMsgRequest } from '@test-utils/network/msw/handle-get-msg';
import { getRestHandlers, registerRestHandler } from '@test-utils/network/msw/handlers';

vi.mock('@zextras/carbonio-ui-preview');

let server: SetupServer;

expect.extend({ toHaveStyleRule: matchers.toHaveStyleRule });

export const defaultBeforeAllTests = (
	{ onUnhandledRequest }: { onUnhandledRequest: 'warn' | 'error' | 'bypass' } = {
		onUnhandledRequest: 'bypass'
	}
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

// eslint-disable-next-line global-require
// const { useFolderStore, useTagStore } = await require('@zextras/carbonio-ui-commons');
// ------------------ TEST LIFECYCLE ------------------

beforeAll(() => {
	// Register additional handlers
	const h = http.post('/service/soap/GetMsgRequest', handleGetMsgRequest);
	const j = http.post('/service/soap/GetConvRequest', handleGetConvRequest);
	registerRestHandler(h);
	registerRestHandler(j);

	defaultBeforeAllTests({ onUnhandledRequest: 'bypass' });

	// Mock localStorage hooks
	useLocalStorage.mockReturnValue([vi.fn(), vi.fn()]);
});

afterEach(() => {
	vi.clearAllTimers();
});

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true, shouldClearNativeTimers: true });
	useEditorsStore.setState({});
	getUseEmailStoreAndHooksForTesting().resetMessagesAndPopulatedItems();
	getUseEmailStoreAndHooksForTesting().resetConversationAndPopulatedItems();
	getUseEmailStoreAndHooksForTesting().resetSearchAndPopulatedItems();
});

afterAll(() => {
	server.resetHandlers();
	server.close();
});

// ------------------ GLOBAL MOCKS ------------------

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
	writable: true,
	value: vi.fn(function ResizeObserverMock(
		this: ResizeObserver,
		callback: ResizeObserverCallback
	): ResizeObserver {
		return {
			observe: (target: Element): void => {
				// Trigger callback immediately with default dimensions
				callback(
					[
						{
							contentRect: {
								width: 1920,
								height: 1080,
								top: 0,
								left: 0,
								bottom: 1080,
								right: 1920,
								x: 0,
								y: 0,
								toJSON: () => ''
							} as DOMRectReadOnly,
							target,
							borderBoxSize: [] as any,
							contentBoxSize: [] as any,
							devicePixelContentBoxSize: [] as any
						} as ResizeObserverEntry
					],
					this
				);
			},
			unobserve: (): void => undefined,
			disconnect: (): void => undefined
		};
	})
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

// ------------------ EXPORTS ------------------
export const getSetupServer = (): SetupServer => server;
