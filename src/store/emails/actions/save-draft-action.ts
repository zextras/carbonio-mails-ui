/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { saveDraftSoapApi } from 'api/save-draft-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import { publishQuotaChangedEvent } from 'event-bus/publish-event';
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import { createSoapDraftRequestFromEditor } from 'store/editor/editor-transformations';
import { updateMessages, updateMessageStatus } from 'store/emails/store';
import { MailsEditorV2 } from 'types/editor';
import { MailAttachment } from 'types/soap/save-draft';

type SaveDraftEmailStoreAction = {
	editor: MailsEditorV2;
	signal?: AbortSignal;
	attach?: MailAttachment;
};

export async function saveDraftEmailStoreAction({
	editor,
	signal
}: SaveDraftEmailStoreAction): ReturnType<typeof saveDraftSoapApi> {
	const soapDraftMessageObj = createSoapDraftRequestFromEditor(editor);
	const result = await saveDraftSoapApi({ soapDraftMessageObj, signal });
	if (result.m)
		result.m.forEach((message) => {
			const normalizedMessage = normalizeMailMessageFromSoap({
				m: message,
				html: editor.isRichText
			});
			updateMessages([normalizedMessage]);
			updateMessageStatus(normalizedMessage.id, API_REQUEST_STATUS.fulfilled);
		});
	publishQuotaChangedEvent(editor.size);
	return result;
}
