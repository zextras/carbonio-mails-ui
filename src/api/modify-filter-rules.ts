/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

export const modifyFilterRules = async (newRules: Array<any>): Promise<any> => {
	const res = await soapFetch('ModifyFilterRules', {
		filterRules: [{ filterRule: newRules }],
		_jsns: 'urn:zimbraMail'
	});
	return res;
};

export const modifyOutgoingFilterRules = async (newRules: Array<any>): Promise<any> => {
	const res = await soapFetch('ModifyOutgoingFilterRules', {
		filterRules: [{ filterRule: newRules }],
		_jsns: 'urn:zimbraMail'
	});
	return res;
};
