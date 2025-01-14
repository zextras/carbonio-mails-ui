/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ErrorSoapBodyResponse, soapFetch } from '@zextras/carbonio-shell-ui';

import { getConvSoapApi } from './get-conv-soap-api';
import { getMsg } from './helpers/get-msg-service';
import { ParticipantRole } from '../carbonio-ui-commons/constants/participants';
import { getAddressOwnerAccount, getIdentityDescriptor } from '../helpers/identities';
import { getParticipantsFromMessage } from '../helpers/messages';
import { getCertificate } from '../store/certificates/certificate';
import { createSoapSendMsgRequestFromEditor } from '../store/editor/editor-transformations';
import { generateMailRequest } from '../store/editor-slice-utils';
import { getConvAction } from '../store/emails/actions/getConvAction';
import { MailMessage, MailsEditorV2, SaveDraftRequest, SaveDraftResponse } from '../types';

export const sendMsg = async ({
	msg
}: {
	msg: MailMessage;
}): Promise<SaveDraftResponse | ErrorSoapBodyResponse> => {
	const toSend = generateMailRequest(msg);
	const from = getParticipantsFromMessage(msg, ParticipantRole.FROM)?.[0].address;
	// Get the sender account. If not determined then undefined is passed to the soapFetch which will use the default one
	const account = getAddressOwnerAccount(from);
	const response = await soapFetch<SaveDraftRequest, SaveDraftResponse>(
		'SendMsg',
		{
			_jsns: 'urn:zimbraMail',
			m: toSend
		},
		account ?? undefined
	);
	if (response?.m?.[0]?.id) {
		getMsg({ msgId: response.m[0].id });
	}
	if (response?.m?.[0]?.cid) {
		getConvAction({ id: response.m[0].cid });
	}
	return response;
};

export async function sendMsgFromEditor({
	editor
}: {
	editor: MailsEditorV2;
}): Promise<SaveDraftResponse | ErrorSoapBodyResponse> {
	const msg = createSoapSendMsgRequestFromEditor(editor);

	const identity = getIdentityDescriptor(editor.identityId);

	const response = await soapFetch<SaveDraftRequest, SaveDraftResponse>(
		'SendMsg',
		{
			_jsns: 'urn:zimbraMail',
			m: msg,
			...(editor.isSmimeSign
				? {
						sign: true,
						...getCertificate({ accountId: identity?.fromAddress ?? '' })
					}
				: {})
		},
		identity?.ownerAccount ?? undefined
	);
	if (response?.m?.[0]?.id) {
		getMsg({ msgId: response.m[0].id });
	}
	if (response?.m?.[0]?.cid) {
		getConvSoapApi({ conversationId: response.m[0].cid });
	}
	return response;
}
