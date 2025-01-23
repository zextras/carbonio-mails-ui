/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Config } from 'jest';

import { defaultConfig } from './src/carbonio-ui-commons/test/jest-config';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const config: Config = {
	...defaultConfig,
	collectCoverageFrom: [
		'src/**/*.{js,ts}(x)?',
		'!**/__mocks__/**', // Exclude mock files
		'!**/__tests__/**', // Exclude test files
		'!**/*.test.{js,jsx,ts,tsx}', // Exclude test files
		'!**/*.spec.{js,jsx,ts,tsx}', // Exclude test files
		'!src/tests/**', // Exclude test files from src/tests
		'!src/**/test/mocks/**' // Exclude test files from src/**/test/mocks
	],
	moduleNameMapper: {
		...defaultConfig.moduleNameMapper,
		'\\.(css|less)$': '<rootDir>/__mocks__/fileMock.js'
	},
	collectCoverage: true,
	coverageReporters: ['lcov', 'html'],
	testTimeout: 20000
};

export default config;
