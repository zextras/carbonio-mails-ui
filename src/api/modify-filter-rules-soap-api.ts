/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

export const modifyFilterRulesSoapApi = async (newRules: Array<any>): Promise<any> =>
	legacySoapFetch('ModifyFilterRules', {
		filterRules: [{ filterRule: newRules }],
		_jsns: 'urn:zimbraMail'
	});

export const modifyOutgoingFilterRulesSoapApi = async (newRules: Array<any>): Promise<any> =>
	legacySoapFetch('ModifyOutgoingFilterRules', {
		filterRules: [{ filterRule: newRules }],
		_jsns: 'urn:zimbraMail'
	});
