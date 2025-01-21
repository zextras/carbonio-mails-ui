/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

import type { FilterRules } from '../types';

type GetFilterRulesResponse = {
	filterRules: FilterRules;
};

export async function getOutgoingFiltersSoapApi(): Promise<GetFilterRulesResponse> {
	const response = await soapFetch<unknown, GetFilterRulesResponse>('GetOutgoingFilterRules', {
		_jsns: 'urn:zimbraMail'
	}).catch(() => {
		console.warn('Failed to fetch filter rules');
	});
	if (!response) {
		return { filterRules: [{ filterRule: [] }] };
	}
	return { filterRules: response.filterRules as FilterRules };
}
