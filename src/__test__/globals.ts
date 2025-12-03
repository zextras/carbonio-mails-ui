/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { vi } from 'vitest';
import { mockForNodeRequire } from 'vitest-mock-commonjs';

import * as shell from '@test-mocks/@zextras/carbonio-shell-ui';

class AbortController {
	public signal: {
		aborted: boolean;
		addEventListener: (type: string, listener: () => void) => void;
		removeEventListener: (type: string, listener: () => void) => void;
	};

	constructor() {
		this.signal = {
			aborted: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		};
	}

	// Simulate the abort action
	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	abort() {
		this.signal.aborted = true;
	}
}

// Assign the custom AbortController to globalThis and window
(globalThis as any).AbortController = AbortController;

// If you're in a browser-like environment (e.g., jsdom), you might need to redefine it in `window` too
Object.defineProperty(window, 'AbortController', {
	writable: true,
	value: AbortController
});
(globalThis as any).BASE_PATH = '/';

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

mockForNodeRequire('../../assets/notification.mp3', () => ({}));
mockForNodeRequire('../../../assets/carbonio.svg', () => ({}));

vi.mock('@zextras/carbonio-shell-ui', async () => ({
	...(await vi.importActual('@zextras/carbonio-shell-ui')),
	...shell
}));
