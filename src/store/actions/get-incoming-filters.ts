/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { normalizeFilterRulesFromSoap } from '../../normalizations/normalize-filter-rules';
import type { FilterRules } from '../../types';

export const getIncomingFilters = async (): Promise<any> => {
	const { filterRules } = (await soapFetch('GetFilterRules', {
		_jsns: 'urn:zimbraMail'
	})) as { filterRules: FilterRules };
	const normalizedFilterRules = normalizeFilterRulesFromSoap(filterRules);
	return normalizedFilterRules;
};
