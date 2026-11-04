/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';

import { publishQuotaChangedEvent } from 'event-bus/publish-event';
import { getIdentityDescriptor } from 'helpers/identities';
import { getCertificatesPassword } from 'store/certificates/certificate';
import { createSoapSendMsgRequestFromEditor } from 'store/editor/editor-transformations';
import { getMessageEmailStoreAction } from 'store/emails/actions/get-message';
import { MailsEditorV2 } from 'types/editor';
import { SoapSendMsgFault, SoapSendMsgRequest, SoapSendMsgResponse } from 'types/soap/send-msg';

export async function sendMsgFromEditor({
	editor
}: {
	editor: MailsEditorV2;
}): Promise<SoapSendMsgResponse | SoapSendMsgFault> {
	const msg = createSoapSendMsgRequestFromEditor(editor);

	const identity = getIdentityDescriptor(editor.identityId);

	const { Body } = await soapFetchV2<SoapSendMsgRequest, { SendMsgResponse: SoapSendMsgResponse }>(
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
	const response = 'Fault' in Body ? Body : Body.SendMsgResponse;
	const sentMessage = 'Fault' in Body ? undefined : Body.SendMsgResponse?.m?.[0];
	if (sentMessage?.id) {
		getMessageEmailStoreAction({ messageId: sentMessage.id, html: editor.isRichText });
	}
	publishQuotaChangedEvent(editor.size);
	return response;
}
