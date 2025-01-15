/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetch } from '@zextras/carbonio-shell-ui';

import { normalizeFilterRulesFromSoap } from '../normalizations/normalize-filter-rules';
import type { FilterRules } from '../types';

export type FilterRulesAPIResponse = {
	filterRules: FilterRules;
};

export const getIncomingFilters = async (): Promise<FilterRulesAPIResponse> => {
	const { filterRules } = await soapFetch<unknown, FilterRulesAPIResponse>('GetFilterRules', {
		_jsns: 'urn:zimbraMail'
	});
	return normalizeFilterRulesFromSoap(filterRules);
};

export const getOutgoingFilters = async (): Promise<FilterRulesAPIResponse> => {
	const { filterRules } = await soapFetch<unknown, FilterRulesAPIResponse>(
		'GetOutgoingFilterRules',
		{
			_jsns: 'urn:zimbraMail'
		}
	);
	return { filterRules };
};
