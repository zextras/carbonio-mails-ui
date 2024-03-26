import { ErrorSoapBodyResponse, soapFetch } from '@zextras/carbonio-shell-ui';

import {
	CreateSmartLinksRequest,
	CreateSmartLinksResponse,
	SmartLinkAttachment
} from '../../types';

/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export async function createSmartLinksSoapAPI(
	attachmentsToConvert: Array<SmartLinkAttachment>
): Promise<CreateSmartLinksResponse> {
	return soapFetch<CreateSmartLinksRequest, CreateSmartLinksResponse | ErrorSoapBodyResponse>(
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
