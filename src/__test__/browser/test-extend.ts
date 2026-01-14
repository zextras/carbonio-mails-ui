/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { setupWorker } from 'msw/browser';
import { test as testBase } from 'vitest';

const worker = setupWorker();
export const test = testBase.extend({
	worker: [
		// eslint-disable-next-line no-empty-pattern
		async ({}, use): Promise<void> => {
			// Start the worker before the test.
			await worker.start();

			// Expose the worker object on the test's context.
			await use(worker);

			// Remove any request handlers added in individual test cases.
			// This prevents them from affecting unrelated tests.
			worker.resetHandlers();

			// Stop the worker after the test.
			worker.stop();
		},
		{
			auto: true
		}
	]
});
