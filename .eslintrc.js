/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
module.exports = {
	extends: ['./node_modules/@zextras/carbonio-ui-configs/rules/eslint.js'],
	plugins: ['unused-imports', 'jest-dom', 'testing-library', 'notice'],
	overrides: [
		{
			// enable eslint-plugin-testing-library rules or preset only for test files
			files: [
				'**/__tests__/**/*.[jt]s?(x)',
				'**/?(*.)+(spec|test).[jt]s?(x)',
				'**/utils/test-setup.tsx',
				'jest-setup.ts'
			],
			extends: ['plugin:jest-dom/recommended', 'plugin:testing-library/react'],
			rules: {
				'testing-library/no-global-regexp-flag-in-query': 'error',
				'testing-library/prefer-user-event': 'warn',
				'import/no-extraneous-dependencies': 'off'
			}
		}
	],
	rules: {
		'no-console': ['error', { allow: ['error', 'warn'] }]
		// 'notice/notice': [
		// 	'error',
		// 	{
		// 		templateFile: './notice.template.ts'
		// 	}
		// ],
		// 'import/order': [
		// 	'error',
		// 	{
		// 		groups: [['builtin', 'external']],
		// 		pathGroups: [
		// 			{
		// 				pattern: 'react',
		// 				group: 'external',
		// 				position: 'before'
		// 			}
		// 		],
		// 		pathGroupsExcludedImportTypes: ['react'],
		// 		'newlines-between': 'always',
		// 		alphabetize: {
		// 			order: 'asc',
		// 			caseInsensitive: true
		// 		}
		// 	}
		// ],
		// 'unused-imports/no-unused-imports': 'error',
		// 'unused-imports/no-unused-vars': [
		// 	'warn',
		// 	{ vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }
		// ]
	},
	settings: {
		'import/resolver': {
			node: {
				moduleDirectory: ['node_modules', 'utils'],
				extensions: ['.js', '.jsx', '.d.ts', '.ts', '.tsx']
			}
		}
	},
	ignorePatterns: ['notice.template.ts']
};
