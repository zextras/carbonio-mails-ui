/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { GenericSoapApiError } from '@zextras/carbonio-ui-commons';
import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { generateRequest } from 'store/editor-slice-utils';
import { MailsEditor } from 'types/editor';
import { SaveDraftRequest, SaveDraftResponse } from 'types/soap/save-draft';

// TODO create a generic function to call sendMsg and remove this one
// TODO probably the owner account should be set also here
export const acceptSharedFolderReply = async (
	data: Pick<MailsEditor, 'attach' | 'subject' | 'participants' | 'text'>
): Promise<SaveDraftResponse> => {
	const toSend = generateRequest(data);
	const resp = await legacySoapFetch<SaveDraftRequest, SaveDraftResponse | ErrorSoapBodyResponse>(
		'SendMsg',
		{
			_jsns: 'urn:zimbraMail',
			m: toSend
		}
	);

	if ('Fault' in resp) {
		throw new GenericSoapApiError(resp.Fault);
	}

	return resp;
};
