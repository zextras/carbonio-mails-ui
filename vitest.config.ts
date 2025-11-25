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
		setupFiles: ['./src/__test__/vitest-setup.tsx', './src/__test__/setup-browser-env.ts'],
		clearMocks: true,
		environmentOptions: {
			jsdom: {
				url: 'http://localhost'
			}
		},
		mockReset: true,
		testTimeout: 20000,
		reporters: ['default'],
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: ['text', 'cobertura', 'lcov'],
			reportsDirectory: 'coverage',
			include: ['src/**/*.{ts,tsx}'],
			exclude: ['**/__test__/**', '**/tests/**', '**/mocks/**', '**/*.test.{js,jsx,ts,tsx}']
		}
	}
});
