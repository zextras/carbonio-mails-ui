/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

export const modifyFilterRulesSoapApi = async (newRules: Array<any>): Promise<any> =>
	soapFetch('ModifyFilterRules', {
		filterRules: [{ filterRule: newRules }],
		_jsns: 'urn:zimbraMail'
	});

export const modifyOutgoingFilterRulesSoapApi = async (newRules: Array<any>): Promise<any> =>
	soapFetch('ModifyOutgoingFilterRules', {
		filterRules: [{ filterRule: newRules }],
		_jsns: 'urn:zimbraMail'
	});
