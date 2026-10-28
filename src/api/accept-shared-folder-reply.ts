/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { GenericSoapApiError } from '@zextras/carbonio-ui-commons';
import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { MailsEditor } from 'types/editor';
import { SaveDraftRequest, SaveDraftResponse, SoapDraftMessageObj } from 'types/soap/save-draft';

// TODO create a generic function to call sendMsg and remove this one
// TODO probably the owner account should be set also here
export const acceptSharedFolderReply = async (
	data: Pick<MailsEditor, 'attach' | 'subject' | 'participants' | 'text'>
): Promise<SaveDraftResponse> => {
	const toSend: SoapDraftMessageObj = {
		attach: data.attach,
		su: { _content: data.subject ?? '' },
		e: (data.participants ?? []).map((participant) => ({
			t: participant.type,
			a: participant.address,
			d: participant.fullName
		})),
		mp: [{ ct: 'text/plain', body: true, content: { _content: data.text[0] ?? '' } }]
	};
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
