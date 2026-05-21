/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ParticipantRole } from '@zextras/carbonio-ui-commons';
import { ErrorSoapBodyResponse, legacySoapFetch, soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';

import { getAddressOwnerAccount, getIdentityDescriptor } from 'helpers/identities';
import { getParticipantsFromMessage } from 'helpers/messages';
import { getCertificatesPassword } from 'store/certificates/certificate';
import { createSoapSendMsgRequestFromEditor } from 'store/editor/editor-transformations';
import { generateMailRequest } from 'store/editor-slice-utils';
import { getConvEmailStoreAction } from 'store/emails/actions/get-conv-action';
import { getMessageEmailStoreAction } from 'store/emails/actions/get-message';
import { getMessageWithExistingParticipantsEmailStoreAction } from 'store/emails/actions/get-message-with-existing-participants';
import { MailMessage, MailsEditorV2, SaveDraftRequest, SaveDraftResponse, SendMsgResult } from 'types/index.d';
import { saveDraftEmailStoreAction } from 'store/emails/actions/save-draft-action';
import { SoapSendMsgResponse } from 'types/soap/send-msg';
import { SoapSendMsgRequest } from '../types/soap/send-msg';

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
}): Promise<SoapSendMsgResponse| ErrorSoapBodyResponse> {

	const msg = createSoapSendMsgRequestFromEditor(editor);
	const identity = getIdentityDescriptor(editor.identityId);
	const errRes = {} as ErrorSoapBodyResponse;

	if (editor?.identityId) {

		const prepareMsgBody = {
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
		};

		const response = await soapFetchV2<SoapSendMsgRequest,SoapSendMsgResponse>(
			'SendMsg',
			prepareMsgBody,
			identity?.ownerAccount ?? undefined
		);

		if (response && 'SendMsgResponse' in response.Body) {
			const sendMsgResponse = response.Body?.SendMsgResponse as SoapSendMsgResponse;
			return sendMsgResponse;
		}

		if (response && 'Fault' in response.Body) {
			const errorDescription = response.Body as ErrorSoapBodyResponse;
			return errorDescription;
		}

	}

	errRes.Fault = {
		Code: {
			Value: 'Client'
		},
		Reason: {
			Text: 'Unexpected error occurred while sending the message'
		},
		Detail: { Error: {
			Code: 'SendingBlocked',
			Trace: ''
		} }
	};

	return errRes;
}
