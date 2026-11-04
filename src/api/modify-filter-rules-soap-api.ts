/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { GenericSoapApiError } from '@zextras/carbonio-ui-commons';
import { soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';

import type { Filter } from 'types/filters';

export type ModifyFilterRulesRequest = {
	filterRules: [{ filterRule: Array<Filter> }];
	_jsns: 'urn:zimbraMail';
};

/** The server answers with an empty body */
type ModifyFilterRulesResponse = { _jsns: 'urn:zimbraMail' };

const modifyFilterRules = async (
	request: 'ModifyFilterRules' | 'ModifyOutgoingFilterRules',
	newRules: Array<Filter>
): Promise<void> => {
	const responseName = `${request}Response` as const;
	const { Body } = await soapFetchV2<
		ModifyFilterRulesRequest,
		Record<typeof responseName, ModifyFilterRulesResponse>
	>(request, {
		filterRules: [{ filterRule: newRules }],
		_jsns: 'urn:zimbraMail'
	});
	// a rejected save must not look like a saved one
	if ('Fault' in Body) {
		throw new GenericSoapApiError(Body.Fault);
	}
};

export const modifyFilterRulesSoapApi = (newRules: Array<Filter>): Promise<void> =>
	modifyFilterRules('ModifyFilterRules', newRules);

export const modifyOutgoingFilterRulesSoapApi = (newRules: Array<Filter>): Promise<void> =>
	modifyFilterRules('ModifyOutgoingFilterRules', newRules);
