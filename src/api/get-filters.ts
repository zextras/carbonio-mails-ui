/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { GenericSoapApiError } from '@zextras/carbonio-ui-commons';
import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { normalizeFilterRulesFromSoap } from 'normalizations/normalize-filter-rules';
import { FilterRules } from 'types/filters';

export type FilterRulesAPIResponse = {
	filterRules: FilterRules;
};

const fetchFilterRules = async (
	request: 'GetFilterRules' | 'GetOutgoingFilterRules'
): Promise<FilterRules> => {
	const response = await legacySoapFetch<unknown, FilterRulesAPIResponse | ErrorSoapBodyResponse>(
		request,
		{
			_jsns: 'urn:zimbraMail'
		}
	);
	// a fault must not look like an empty list: saving it would delete every rule
	if ('Fault' in response) {
		throw new GenericSoapApiError(response.Fault);
	}
	return response.filterRules;
};

export const getIncomingFilters = async (): Promise<FilterRulesAPIResponse> =>
	normalizeFilterRulesFromSoap(await fetchFilterRules('GetFilterRules'));

export const getOutgoingFilters = async (): Promise<FilterRulesAPIResponse> => ({
	filterRules: await fetchFilterRules('GetOutgoingFilterRules')
});
