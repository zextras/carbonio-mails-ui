/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ErrorSoapBodyResponse, soapFetch } from '@zextras/carbonio-shell-ui';

import { GenericSoapApiError } from '../../carbonio-ui-commons/soap/errors/generic-soap-api-error';
import type { MailsEditor, SaveDraftRequest, SaveDraftResponse } from '../../types';
import { generateRequest } from '../editor-slice-utils';

// TODO create a generic function to call sendMsg and remove this one
// TODO probably the owner account should be set also here
export const acceptSharedFolderReply = async (
	data: Pick<MailsEditor, 'attach' | 'subject' | 'participants' | 'text'>
): Promise<SaveDraftResponse> => {
	const toSend = generateRequest(data);
	const resp = await soapFetch<SaveDraftRequest, SaveDraftResponse | ErrorSoapBodyResponse>(
		'SendMsg',
		{
			_jsns: 'urn:zimbraMail',
			m: toSend
		}
	);

	if (resp.Fault) {
		throw new GenericSoapApiError(resp.Fault);
	}

	return resp;
};
