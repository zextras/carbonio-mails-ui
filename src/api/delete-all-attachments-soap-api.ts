/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { SoapMailMessage } from 'types/soap/soap-mail-message';

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
	legacySoapFetch('RemoveAttachments', {
		_jsns: 'urn:zimbraMail',
		m: {
			id,
			part: attachments.join(',')
		}
	});
