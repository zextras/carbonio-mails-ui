/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetch } from '@zextras/carbonio-shell-ui';

export const sendDeliveryReport = async (messageId: string): Promise<any> => {
	const res = await soapFetch('SendDeliveryReport', {
		mid: messageId,
		_jsns: 'urn:zimbraMail'
	});
	return res;
};
