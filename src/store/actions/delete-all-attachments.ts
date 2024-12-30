/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ErrorSoapResponse, soapFetch } from '@zextras/carbonio-shell-ui';

type RemoveAttachmentsProps = {
	id: string;
	attachments: string[];
};

type RemoveAttachmentsResponse = {
	m: {
		id: string;
		part: Array<string>;
	};
};

export const deleteAttachments = async ({
	id,
	attachments
}: RemoveAttachmentsProps): Promise<RemoveAttachmentsResponse | ErrorSoapResponse> =>
	soapFetch('RemoveAttachments', {
		_jsns: 'urn:zimbraMail',
		m: {
			id,
			part: attachments.join(',')
		}
	});
