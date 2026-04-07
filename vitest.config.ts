/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

const junitReporter: ['junit', { outputFile: string; console: boolean }] = [
	'junit',
	{ outputFile: 'junit.xml', console: false }
];

process.env.LANG = 'en_US.UTF-8';
process.env.LC_ALL = 'en_US.UTF-8';
process.env.TZ = 'Europe/Berlin';

export default defineConfig({
	resolve: {
		tsconfigPaths: true
	},
	plugins: [
		react({
			jsxImportSource: '@emotion/react',
			babel: {
				plugins: ['@emotion/babel-plugin']
			}
		})
	],
	publicDir: './',
	server: {
		fs: {
			allow: ['./']
		}
	},
	test: {
		reporters: ['default', junitReporter],
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: ['cobertura', 'lcov'],
			reportsDirectory: 'coverage',
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'**/__test__/**',
				'**/tests/**',
				'**/mocks/**',
				'**/*.test.{js,jsx,ts,tsx}',
				'**/*.browser-test.{js,jsx,ts,tsx}'
			]
		},
		projects: [
			{
				resolve: {
					tsconfigPaths: true
				},
				plugins: [
					react({
						jsxImportSource: '@emotion/react',
						babel: {
							plugins: ['@emotion/babel-plugin']
						}
					})
				],
				test: {
					name: 'unit',
					globals: true,
					environment: 'jsdom',
					setupFiles: [
						'./src/__test__/globals.ts',
						'./src/__test__/worker.ts',
						'./src/__test__/vitest-setup.tsx',
						'./src/__test__/setup-browser-env.ts'
					],
					clearMocks: true,
					isolate: true,
					pool: 'forks',
					maxWorkers: '80%',
					environmentOptions: {
						jsdom: {
							url: 'http://localhost'
						}
					},
					testTimeout: 20000,
					hookTimeout: 20000,
					exclude: [
						...configDefaults.exclude,
						'**/*.browser-test.*',
						'**/app.test.tsx',
						'**/use-conversations-list-by-folder.test.ts',
						'**/certificate-utils.test.ts',
						'**/recover-messages.test.tsx',
						'**/rich-text-editor-container.test.tsx',
						'**/share-folder-actions.test.ts',
						'**/recipients-certificates-settings.test.tsx',
						'**/move-conv.test.tsx' // flaky test, needs to be fixed (Timeout frequently)
					]
				}
			},
			{
				resolve: {
					tsconfigPaths: true
				},
				plugins: [
					react({
						jsxImportSource: '@emotion/react',
						babel: {
							plugins: ['@emotion/babel-plugin']
						}
					})
				],
				test: {
					name: 'browser',
					globals: true,
					setupFiles: [
						'./src/__test__/browser/base-path.ts',
						'./src/__test__/browser/shell-setup.tsx'
					],
					clearMocks: true,
					maxWorkers: '80%',
					browser: {
						enabled: true,
						instances: [{ browser: 'chromium' }],
						provider: playwright(),
						headless: false,
						screenshotFailures: false
					},
					mockReset: false,
					testTimeout: 20000,
					hookTimeout: 20000,
					include: ['**/*.browser-test.*'],
					exclude: [...configDefaults.exclude, '**/*.test.*']
				}
			}
		]
	}
});
