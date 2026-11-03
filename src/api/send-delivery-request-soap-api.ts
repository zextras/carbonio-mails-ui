/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import {
	SendDeliveryReportRequest,
	SendDeliveryReportResponse
} from 'types/soap/send-delivery-report';

export const sendDeliveryReportSoapApi = async (
	messageId: string
): Promise<SendDeliveryReportResponse | ErrorSoapBodyResponse> =>
	legacySoapFetch<SendDeliveryReportRequest, SendDeliveryReportResponse | ErrorSoapBodyResponse>(
		'SendDeliveryReport',
		{
			mid: messageId,
			_jsns: 'urn:zimbraMail'
		}
	);
