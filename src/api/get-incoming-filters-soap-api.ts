/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

import { normalizeFilterRulesFromSoap } from 'normalizations/normalize-filter-rules';
import { FilterRules } from 'types/index.d';

type GetFilterRulesResponse = {
	filterRules: FilterRules;
};
export const getIncomingFiltersSoapApi = async (): Promise<GetFilterRulesResponse> => {
	const response = await soapFetch<unknown, GetFilterRulesResponse>('GetFilterRules', {
		_jsns: 'urn:zimbraMail'
	}).catch(() => {
		console.warn('Failed to fetch filter rules');
	});
	if (!response) {
		return { filterRules: [{ filterRule: [] }] };
	}
	return normalizeFilterRulesFromSoap(response.filterRules as FilterRules);
};
