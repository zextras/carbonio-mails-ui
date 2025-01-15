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
	const { filterRules } = (await soapFetch('GetFilterRules', {
		_jsns: 'urn:zimbraMail'
	})) as { filterRules: FilterRules };
	return normalizeFilterRulesFromSoap(filterRules);
};

export const getOutgoingFilters = async (): Promise<FilterRulesAPIResponse> => {
	const { filterRules } = (await soapFetch('GetOutgoingFilterRules', {
		_jsns: 'urn:zimbraMail'
	})) as { filterRules: FilterRules };
	return { filterRules };
};
