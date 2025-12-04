/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

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
		testTimeout: 20000,
		hookTimeout: 20000,
		reporters: ['default', 'junit'],
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: ['text', 'cobertura', 'lcov'],
			reportsDirectory: 'coverage',
			include: ['src/**/*.{ts,tsx}'],
			exclude: ['**/__test__/**', '**/tests/**', '**/mocks/**', '**/*.test.{js,jsx,ts,tsx}']
		},
		exclude: [
			...configDefaults.exclude,
			'**/app.test.tsx',
			'**/use-conversations-list-by-folder.test.ts',
			// '**/editor-generators.test.ts',
			'**/recover-messages.test.tsx',
			'**/share-folder-actions.test.ts',
			'**/useEditorAttachments.test.tsx',
			'**/get-conv-action.test.ts',
			'**/get-message-with-existing-participants.test.ts',
			'**/certificate-utils.test.ts',
			'**/rich-text-editor-container.test.tsx',
			'**/sort-and-filter-button-component.test.tsx',
			'**/recipients-certificates-settings.test.tsx' // error certificates.map
		]
	}
});
