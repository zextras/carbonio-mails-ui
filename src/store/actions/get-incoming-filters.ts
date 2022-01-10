/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/zapp-shell';
import { normalizeFilterRulesFromSoap } from '../../normalizations/normalize-filter-rules';

export const getIncomingFilters = async (): Promise<any> => {
	const { filterRules } = await soapFetch('GetFilterRules', {
		_jsns: 'urn:zimbraMail'
	});
	const normalizedFilterRules = normalizeFilterRulesFromSoap(filterRules);
	return normalizedFilterRules;
};
