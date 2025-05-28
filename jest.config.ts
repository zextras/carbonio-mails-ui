/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Config } from 'jest';

const config: Config = {
	testEnvironment: '<rootDir>/src/__test__/jsdom-extended.ts',
	setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
	clearMocks: true,
	collectCoverage: true,
	collectCoverageFrom: [
		'src/**/*.{js,ts}(x)?',
		'!**/__mocks__/**', // Exclude mock files
		'!**/__tests__/**', // Exclude test files
		'!**/*.test.{js,jsx,ts,tsx}', // Exclude test files
		'!**/*.spec.{js,jsx,ts,tsx}', // Exclude test files
		'!src/tests/**', // Exclude test files from src/tests
		'!src/**/test/mocks/**' // Exclude test files from src/**/test/mocks
	],
	coverageDirectory: 'coverage',
	coverageProvider: 'babel',
	coverageReporters: ['lcov', 'html'],
	testTimeout: 20000,
	fakeTimers: {
		enableGlobally: true
	},
	maxWorkers: '50%',
	moduleDirectories: ['node_modules', 'utils'],
	moduleNameMapper: {
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/__mocks__/fileMock.js',
		uuid: require.resolve('uuid'),
		'\\.(css|less)$': '<rootDir>/__mocks__/fileMock.js',
		'^@test-utils/(.*)$': '<rootDir>/src/__test__/mocks/$1',
		'^@test-setup$': '<rootDir>/src/__test__/test-setup.tsx',
		'^@jest-setup$': '<rootDir>/jest-setup.ts'
	},
	reporters: ['default', 'jest-junit'],
	testEnvironmentOptions: {
		customExportConditions: ['']
	},
	transformIgnorePatterns: ['/node_modules/(?!@zextras/carbonio-ui-commons).+\\.js$'],
	transform: {
		'^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { configFile: './babel.config.jest.js' }]
	}
};

export default config;
