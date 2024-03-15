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
	moduleNameMapper: {
		...defaultConfig.moduleNameMapper,
		'\\.(css|less)$': '<rootDir>/__mocks__/fileMock.js'
	},
	collectCoverage: false,
	testTimeout: 20000,

	// The test environment that will be used for testing
	/**
	 * @note Override test environment to set again Request, Response, TextEncoder and other
	 * fields
	 * @see https://mswjs.io/docs/migrations/1.x-to-2.x#requestresponsetextencoder-is-not-defined-jest
	 * @see https://github.com/mswjs/msw/issues/1916#issuecomment-1919965699
	 */
	testEnvironment: '<rootDir>/src/carbonio-ui-commons/test/jsdom-extended.ts',

	/**
	 * @see https://mswjs.io/docs/migrations/1.x-to-2.x#cannot-find-module-mswnode-jsdom
	 */
	testEnvironmentOptions: {
		customExportConditions: ['']
	}
};

export default config;
