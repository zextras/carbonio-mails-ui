/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { normalizeFilterRulesFromSoap } from 'normalizations/normalize-filter-rules';
import { FilterRules } from 'types/filters';

export type FilterRulesAPIResponse = {
	filterRules: FilterRules;
};

export const getIncomingFilters = async (): Promise<FilterRulesAPIResponse> => {
	const { filterRules } = await legacySoapFetch<unknown, FilterRulesAPIResponse>('GetFilterRules', {
		_jsns: 'urn:zimbraMail'
	});
	return normalizeFilterRulesFromSoap(filterRules);
};

export const getOutgoingFilters = async (): Promise<FilterRulesAPIResponse> => {
	const { filterRules } = await legacySoapFetch<unknown, FilterRulesAPIResponse>(
		'GetOutgoingFilterRules',
		{
			_jsns: 'urn:zimbraMail'
		}
	);
	return { filterRules };
};
