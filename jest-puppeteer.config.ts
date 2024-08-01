/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Config } from 'jest';

import { defaultConfig } from './src/carbonio-ui-commons/test/jest-config';

const config: Config = {
	moduleNameMapper: {
		...defaultConfig.moduleNameMapper,
		'\\.(css|less)$': '<rootDir>/__mocks__/fileMock.js'
	},
	collectCoverage: true,
	coverageReporters: ['lcov', 'html'],
	testTimeout: 20000
};

export default config;
