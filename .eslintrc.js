/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
module.exports = {
	extends: [require.resolve('@zextras/carbonio-ui-configs/rules/eslint')],
	plugins: ['unused-imports', 'jest-dom', 'testing-library', 'notice'],
	overrides: [
		{
			// enable eslint-plugin-testing-library rules or preset only for test files
			files: [
				'**/__tests__/**/*.[jt]s?(x)',
				'**/?(*.)+(spec|test).[jt]s?(x)',
				'**/test-setup.tsx',
				'jest-setup.ts'
			],
			extends: ['plugin:jest-dom/recommended', 'plugin:testing-library/react'],
			rules: {
				'testing-library/no-global-regexp-flag-in-query': 'error',
				'testing-library/prefer-user-event': 'error',
				'import/no-extraneous-dependencies': 'off'
			}
		}
	],
	rules: {
		'import/order': [
			'warn',
			{
				groups: [['builtin', 'external']],
				pathGroups: [
					{
						pattern: 'react',
						group: 'external',
						position: 'before'
					}
				],
				pathGroupsExcludedImportTypes: ['react'],
				'newlines-between': 'always',
				alphabetize: {
					order: 'asc',
					caseInsensitive: true
				}
			}
		],
		'no-console': ['error', { allow: ['error', 'warn'] }],
		'notice/notice': [
			'error',
			{
				templateFile: 'src/notice.template.ts'
			}
		],
		// sonar lint rules
		'sonarjs/cognitive-complexity': 'warn',
		'sonarjs/no-collapsible-if': 'warn',
		'sonarjs/no-duplicate-string': 'warn',
		'sonarjs/no-duplicated-branches': 'warn',
		'sonarjs/no-identical-conditions': 'warn',
		'sonarjs/no-identical-expressions': 'warn',
		'sonarjs/no-redundant-boolean': 'warn',
		'sonarjs/no-small-switch': 'warn',
		'sonarjs/no-unused-collection': 'warn',
		'sonarjs/no-use-of-empty-return-value': 'warn',
		'sonarjs/prefer-immediate-return': 'warn',
		'sonarjs/prefer-object-literal': 'warn',
		'sonarjs/prefer-single-boolean-return': 'warn',
		'sonarjs/prefer-while': 'warn',
		'sonarjs/no-useless-catch': 'warn',
		'sonarjs/no-nested-template-literals': 'warn',
		'sonarjs/no-all-duplicated-branches': 'warn',
		'sonarjs/no-gratuitous-expressions': 'warn',
		'sonarjs/max-switch-cases': 'warn',
		'sonarjs/no-empty-collection': 'warn',
		'sonarjs/no-identical-functions': 'warn',

		'@typescript-eslint/no-shadow': 'warn',
		'@typescript-eslint/no-explicit-any': 'warn',

		'no-param-reassign': [
			'warn',
			{ props: true, ignorePropertyModificationsFor: ['accumulator', 'state', 'event'] }
		],
		'unused-imports/no-unused-imports': 'warn'
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
