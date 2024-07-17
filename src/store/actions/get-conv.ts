/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getTags, soapFetch } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { API_REQUEST_STATUS } from '../../constants';
import { normalizeConversationOld } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import type {
	Conversation,
	GetConvParameters,
	GetConvRequest,
	GetConvResponse,
	IncompleteMessage
} from '../../types';

export const getConv = createAsyncThunk<
	{ conversation: Partial<Conversation>; messages: Array<IncompleteMessage> },
	GetConvParameters
>(
	'conversations/getConv',
	async ({ conversationId, fetch = 'all' }) => {
		const result = (await soapFetch<GetConvRequest, GetConvResponse>('GetConv', {
			_jsns: 'urn:zimbraMail',
			c: {
				id: conversationId,
				html: 1,
				needExp: 1,
				fetch
			}
		})) as GetConvResponse;
		const tags = getTags();
		const conversation = normalizeConversationOld({ c: result.c[0], tags });
		const messages = map(result.c[0].m, (item) =>
			normalizeMailMessageFromSoap(item, false)
		) as unknown as Array<IncompleteMessage>;
		return { conversation, messages };
	},
	{
		condition: ({ folderId, conversationId }: GetConvParameters, { getState }: any) => {
			if (!folderId) return true;
			return (
				getState().conversations?.expandedStatus[conversationId] !== API_REQUEST_STATUS.fulfilled &&
				getState().conversations?.expandedStatus[conversationId] !== API_REQUEST_STATUS.pending
			);
		}
	}
);
