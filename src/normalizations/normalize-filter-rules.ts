/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { map, omit } from 'lodash';

import { AllFiltersTest, FilterRules } from 'types/filters';

const normalizeFilterTests = (filterTests: AllFiltersTest): AllFiltersTest => {
	const result: AllFiltersTest = { condition: filterTests.condition };
	const keys = Object.keys(filterTests) as Array<keyof AllFiltersTest>;
	keys.forEach((testKey) => {
		if (testKey !== 'condition') {
			result[testKey] = map(filterTests[testKey], (filterTest) => omit(filterTest, 'index'));
		}
	});
	return result;
};

export const normalizeFilterRulesFromSoap = (
	filterRules: FilterRules
): { filterRules: FilterRules } => {
	const filterRule = map(filterRules?.[0]?.filterRule, (soapApiFilterRule) => ({
		...soapApiFilterRule,
		filterTests: [normalizeFilterTests(soapApiFilterRule.filterTests[0])]
	}));
	return { filterRules: [{ filterRule }] };
};
