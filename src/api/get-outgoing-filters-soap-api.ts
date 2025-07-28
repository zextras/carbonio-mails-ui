/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { JSNS, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import type { FilterRules } from 'types/index.d';

type GetFilterRulesResponse = {
	filterRules: FilterRules;
};

export async function getOutgoingFiltersSoapApi(): Promise<GetFilterRulesResponse> {
	const response = await legacySoapFetch<unknown, GetFilterRulesResponse>(
		'GetOutgoingFilterRules',
		{
			_jsns: JSNS.mail
		}
	).catch(() => {
		console.warn('Failed to fetch filter rules');
	});
	if (!response) {
		return { filterRules: [{ filterRule: [] }] };
	}
	return { filterRules: response.filterRules as FilterRules };
}
