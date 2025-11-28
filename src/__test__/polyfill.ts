/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// test/setup.ts

import { TextEncoder, TextDecoder } from 'util';
import 'whatwg-fetch'; // polyfill fetch, Request, Response, Headers

(globalThis as any).ReadableStream = ReadableStream;
(globalThis as any).TransformStream = TransformStream;
(globalThis as any).WritableStream = WritableStream;

(globalThis as any).TextDecoder = TextDecoder;
(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).BroadcastChannel =
	(globalThis as any).BroadcastChannel ||
	class {
		postMessage() {}

		close() {}
	};
(globalThis as any).structuredClone =
	(globalThis as any).structuredClone || ((obj: any) => JSON.parse(JSON.stringify(obj)));

// Blob, FormData, Headers, Request, Response, fetch
// if using jsdom >= 21, most of these are already available
