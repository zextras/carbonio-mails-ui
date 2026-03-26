/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getConvSoapApi } from 'api/get-conv-soap-api';
import { updateConversations, updateMessages } from 'store/emails/store';

// TODO: this does not return any result, it is meant just to make an api call and update the store.
//  I suggest to make a hook which loads and returns data instead, avoid functions that do not return anything if possible
export async function getConvEmailStoreAction({
	id,
	onConversationIdChange,
	html
}: {
	id: string;
	onConversationIdChange?: (id: string) => void;
	html: boolean;
}): Promise<void> {
	const getConvResponse = await getConvSoapApi({
		conversationId: id,
		onConversationIdChange,
		html
	});
	updateMessages(getConvResponse.messages);
	updateConversations(getConvResponse.conversation);
}
