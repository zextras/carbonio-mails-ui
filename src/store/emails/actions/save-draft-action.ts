/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { saveDraftSoapApi } from '../../../api/save-draft-soap-api';
import { API_REQUEST_STATUS } from '../../../constants';
import { normalizeMailMessageFromSoap } from '../../../normalizations/normalize-message';
import { SaveDraftParameters } from '../../../types';
import { createOrUpdateMessages, updateMessageStatus } from '../store';

export async function saveDraftEmailStoreAction({
	editor,
	signal
}: SaveDraftParameters): ReturnType<typeof saveDraftSoapApi> {
	const result = await saveDraftSoapApi({ editor, signal });
	if (result.m)
		result.m.forEach((message) => {
			const normalizedMessage = normalizeMailMessageFromSoap(message);
			createOrUpdateMessages([normalizedMessage]);
			updateMessageStatus(normalizedMessage.id, API_REQUEST_STATUS.fulfilled);
		});
	return result;
}
