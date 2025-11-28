/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { vi } from 'vitest';

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
