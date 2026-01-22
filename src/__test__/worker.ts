/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Worker mock

import { noop } from 'lodash';
import { vi } from 'vitest';

import * as soapUiLib from '@test-mocks/@zextras/carbonio-ui-soap-lib';

type MessageHandler = (msg: string) => void;

class Worker {
	url: string;

	onmessage: MessageHandler;

	constructor(stringUrl: string, metaUrl: string) {
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

vi.mock('@zextras/carbonio-ui-soap-lib', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-soap-lib')),
	...soapUiLib
}));
