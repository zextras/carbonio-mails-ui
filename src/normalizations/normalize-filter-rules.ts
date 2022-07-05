/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { reduce, map, omit } from 'lodash';
import { FilterRules, FilterTest } from '../types';

export const normalizeFilterTests = (filterTests: FilterTest): any =>
	reduce(
		Object.keys(filterTests),
		(acc, testKey) => {
			if (testKey !== 'condition') {
				return {
					...acc,
					[testKey]: map(filterTests[testKey], (filterTest) => omit(filterTest, 'index'))
				};
			}
			return {
				...acc,
				condition: filterTests.condition
			};
		},
		{}
	);

export const normalizeFilterRulesFromSoap = (filterRules: FilterRules): any => {
	const filterRule = map(filterRules?.[0]?.filterRule, (f) => ({
		...f,
		filterTests: [normalizeFilterTests(f.filterTests[0])]
	}));
	return { filterRules: [{ filterRule }] };
};
