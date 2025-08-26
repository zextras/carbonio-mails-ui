/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getConvSoapApi } from 'api/get-conv-soap-api';
import { updateConversations, updateMessages } from 'store/emails/store';

export async function getConvEmailStoreAction({
	id,
	onConversationIdChange
}: {
	id: string;
	onConversationIdChange?: (id: string) => void;
}): Promise<void> {
	const getConvResponse = await getConvSoapApi({ conversationId: id, onConversationIdChange });
	updateMessages(getConvResponse.messages);
	updateConversations(getConvResponse.conversation);
}
