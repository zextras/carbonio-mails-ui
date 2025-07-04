/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ErrorSoapBodyResponse, soapFetch } from '@zextras/carbonio-shell-ui';

import { SoapMailMessage } from 'types/index.d';

type RemoveAttachmentsProps = {
	id: string;
	attachments: string[];
};

export type RemoveAttachmentsResponse = {
	m: Array<SoapMailMessage>;
};

export const deleteAttachmentsSoapApi = async ({
	id,
	attachments
}: RemoveAttachmentsProps): Promise<RemoveAttachmentsResponse | ErrorSoapBodyResponse> =>
	soapFetch('RemoveAttachments', {
		_jsns: 'urn:zimbraMail',
		m: {
			id,
			part: attachments.join(',')
		}
	});
