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
	testTimeout: 20000
};

export default config;
