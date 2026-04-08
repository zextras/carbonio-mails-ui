/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { publishQuotaChangedEvent } from 'event-bus/publish-event';
import { getIdentityDescriptor } from 'helpers/identities';
import { getCertificatesPassword } from 'store/certificates/certificate';
import { createSoapSendMsgRequestFromEditor } from 'store/editor/editor-transformations';
import { getConvEmailStoreAction } from 'store/emails/actions/get-conv-action';
import { getMessageEmailStoreAction } from 'store/emails/actions/get-message';
import { MailsEditorV2 } from 'types/editor';
import { SaveDraftRequest, SaveDraftResponse } from 'types/soap/save-draft';

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
		getMessageEmailStoreAction({ messageId: response.m[0].id, html: editor.isRichText });
	}
	if (response?.m?.[0]?.cid) {
		getConvEmailStoreAction({ id: response.m[0].cid, html: editor.isRichText });
	}
	publishQuotaChangedEvent(editor.size);
	return response;
}
