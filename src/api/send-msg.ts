/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ParticipantRole } from '@zextras/carbonio-ui-commons';
import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { getAddressOwnerAccount, getIdentityDescriptor } from 'helpers/identities';
import { getParticipantsFromMessage } from 'helpers/messages';
import { getCertificatesPassword } from 'store/certificates/certificate';
import { createSoapSendMsgRequestFromEditor } from 'store/editor/editor-transformations';
import { generateMailRequest } from 'store/editor-slice-utils';
import { getConvEmailStoreAction } from 'store/emails/actions/get-conv-action';
import { getMessageEmailStoreAction } from 'store/emails/actions/get-message';
import { getMessageWithExistingParticipantsEmailStoreAction } from 'store/emails/actions/get-message-with-existing-participants';
import { MailsEditorV2 } from 'types/editor';
import { MailMessage, SaveDraftRequest, SaveDraftResponse } from 'types/index.d';

export const sendMsg = async ({
	msg
}: {
	msg: MailMessage;
}): Promise<SaveDraftResponse | ErrorSoapBodyResponse> => {
	const toSend = generateMailRequest(msg);
	const from = getParticipantsFromMessage(msg, ParticipantRole.FROM)?.[0].address;
	// Get the sender account. If not determined then undefined is passed to the soapFetch which will use the default one
	const account = getAddressOwnerAccount(from);
	const response = await legacySoapFetch<SaveDraftRequest, SaveDraftResponse>(
		'SendMsg',
		{
			_jsns: 'urn:zimbraMail',
			m: toSend
		},
		account ?? undefined
	);
	if (response?.m?.[0]?.id) {
		getMessageWithExistingParticipantsEmailStoreAction(response.m[0].id, msg?.participants);
	}
	if (response?.m?.[0]?.cid) {
		getConvEmailStoreAction({ id: response.m[0].cid });
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

	const response = await legacySoapFetch<SaveDraftRequest, SaveDraftResponse>(
		'SendMsg',
		{
			_jsns: 'urn:zimbraMail',
			m: msg,
			...(editor.isSmimeSign || editor.isSmimeEncrypt
				? {
						encryptionPassword: getCertificatesPassword(),
						encryptionType: 'smime'
					}
				: {}),
			...(editor.isSmimeSign
				? {
						sign: true
					}
				: {}),
			...(editor.isSmimeEncrypt
				? {
						encrypt: true
					}
				: {})
		},
		identity?.ownerAccount ?? undefined
	);
	if (response?.m?.[0]?.id) {
		getMessageEmailStoreAction(response.m[0].id, true);
	}
	if (response?.m?.[0]?.cid) {
		getConvEmailStoreAction({ id: response.m[0].cid });
	}
	return response;
}
