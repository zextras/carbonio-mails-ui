/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import {
	CreateSmartLinksRequest,
	CreateSmartLinksResponse,
	SmartLinkAttachment
} from 'types/index.d';

export async function createSmartLinksSoapApi(
	attachmentsToConvert: Array<SmartLinkAttachment>
): Promise<CreateSmartLinksResponse> {
	return legacySoapFetch<CreateSmartLinksRequest, CreateSmartLinksResponse | ErrorSoapBodyResponse>(
		'CreateSmartLinks',
		{
			_jsns: 'urn:zimbraMail',
			attachments: attachmentsToConvert
		}
	).then((resp) => {
		if ('Fault' in resp) {
			return Promise.reject(resp.Fault);
		}
		return resp;
	});
}
