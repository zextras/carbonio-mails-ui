/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		react({
			jsxImportSource: '@emotion/react',
			babel: {
				plugins: ['@emotion/babel-plugin']
			}
		}),
		tsconfigPaths()
	],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: [
			'./src/__test__/globals.ts',
			'./src/__test__/worker.ts',
			'./src/__test__/vitest-setup.tsx',
			'./src/__test__/setup-browser-env.ts'
		],
		clearMocks: true,
		maxWorkers: '80%',
		environmentOptions: {
			jsdom: {
				url: 'http://localhost'
			}
		},
		mockReset: false,
		testTimeout: 10000,
		hookTimeout: 10000,
		reporters: ['default']
	}
});
