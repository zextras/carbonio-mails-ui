/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { map, mapValues, omit } from 'lodash';

import { AllFiltersTest, FilterRules, FilterTestLists } from 'types/filters';

const normalizeFilterTests = ({ condition, ...tests }: AllFiltersTest): AllFiltersTest => ({
	condition,
	// mapValues keeps each kind with its own tests, which TypeScript can't follow key by key
	...(mapValues(tests, (kindTests) =>
		map(kindTests, (test) => omit(test, 'index'))
	) as FilterTestLists)
});

export const normalizeFilterRulesFromSoap = (
	filterRules: FilterRules
): { filterRules: FilterRules } => {
	const filterRule = map(filterRules?.[0]?.filterRule, (soapApiFilterRule) => ({
		...soapApiFilterRule,
		filterTests: [normalizeFilterTests(soapApiFilterRule.filterTests[0])]
	}));
	return { filterRules: [{ filterRule }] };
};
