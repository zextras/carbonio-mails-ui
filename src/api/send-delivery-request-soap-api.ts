/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';

import {
	SendDeliveryReportRequest,
	SendDeliveryReportResponse
} from 'types/soap/send-delivery-report';

export const sendDeliveryReportSoapApi = async (
	messageId: string
): Promise<SendDeliveryReportResponse | ErrorSoapBodyResponse> => {
	const { Body } = await soapFetchV2<
		SendDeliveryReportRequest,
		{ SendDeliveryReportResponse: SendDeliveryReportResponse }
	>('SendDeliveryReport', {
		mid: messageId,
		_jsns: 'urn:zimbraMail'
	});
	return 'Fault' in Body ? Body : Body.SendDeliveryReportResponse;
};
