/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

export const sendDeliveryReportSoapApi = async (messageId: string): Promise<any> =>
	legacySoapFetch('SendDeliveryReport', {
		mid: messageId,
		_jsns: 'urn:zimbraMail'
	});
