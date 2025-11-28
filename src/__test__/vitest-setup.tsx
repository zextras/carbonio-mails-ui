/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import '@testing-library/jest-dom';
import { matchers } from '@emotion/jest';
import { http } from 'msw';
import { setupServer, SetupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';

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
	vi.clearAllMocks();
	vi.useRealTimers();
});

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
	useEditorsStore.setState({});
	// useTagStore.setState({ tags: {} });
	// useFolderStore.setState({ folders: {} });
	getUseEmailStoreAndHooksForTesting().resetMessagesAndPopulatedItems();
	getUseEmailStoreAndHooksForTesting().resetConversationAndPopulatedItems();
	getUseEmailStoreAndHooksForTesting().resetSearchAndPopulatedItems();
});

afterAll(() => {
	server.resetHandlers();
	server.close();
});

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
});

// ------------------ GLOBAL MOCKS ------------------

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

// ------------------ EXPORTS ------------------
export const getSetupServer = (): SetupServer => server;
