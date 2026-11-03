/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import type { Filter } from 'types/filters';

type ModifyFilterRulesRequest = {
	filterRules: [{ filterRule: Array<Filter> }];
	_jsns: 'urn:zimbraMail';
};

/** The server answers with an empty body */
type ModifyFilterRulesResponse = { _jsns: 'urn:zimbraMail' } | ErrorSoapBodyResponse;

export const modifyFilterRulesSoapApi = async (
	newRules: Array<Filter>
): Promise<ModifyFilterRulesResponse> =>
	legacySoapFetch<ModifyFilterRulesRequest, ModifyFilterRulesResponse>('ModifyFilterRules', {
		filterRules: [{ filterRule: newRules }],
		_jsns: 'urn:zimbraMail'
	});

export const modifyOutgoingFilterRulesSoapApi = async (
	newRules: Array<Filter>
): Promise<ModifyFilterRulesResponse> =>
	legacySoapFetch<ModifyFilterRulesRequest, ModifyFilterRulesResponse>(
		'ModifyOutgoingFilterRules',
		{
			filterRules: [{ filterRule: newRules }],
			_jsns: 'urn:zimbraMail'
		}
	);
