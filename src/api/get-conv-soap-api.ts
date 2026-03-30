/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { map } from 'lodash';

import { MAIL_VERIFICATION_HEADERS } from 'constants/index';
import { normalizeConversations } from 'normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import { NormalizedConversation } from 'types/conversations';
import { IncompleteMessage } from 'types/messages';
import { GetConvRequest, GetConvResponse } from 'types/soap/get-conv';
import { GetConvParameters } from 'types/soap/soap';

export const getConvSoapApi = async ({
	conversationId,
	fetch = 'all',
	onConversationIdChange,
	html
}: GetConvParameters): Promise<{
	conversation: Array<NormalizedConversation>;
	messages: Array<IncompleteMessage>;
}> => {
	const result = await legacySoapFetch<GetConvRequest, GetConvResponse>('GetConv', {
		_jsns: 'urn:zimbraMail',
		c: {
			id: conversationId,
			html,
			needExp: 1,
			header: map(MAIL_VERIFICATION_HEADERS, (header) => ({ n: header })),
			fetch
		}
	});

	/*
	 * A conversation has a negative id if contains only one message.
	 * When a new message is added, the old conversation is deleted
	 * and a new one is created with a positive id.
	 * The backend will return the new conversation both with
	 * the new and the old id.
	 *
	 * When the requested id differs from the returned id the onConversationIdChange
	 * callback is triggered
	 */
	if (result.c[0].id !== conversationId) {
		onConversationIdChange?.(result.c[0].id);
	}

	const conversation = normalizeConversations([result.c[0]]);
	const messages = map(result.c[0].m, (item) =>
		normalizeMailMessageFromSoap({ m: item, isComplete: false, html })
	);
	return { conversation, messages };
};
