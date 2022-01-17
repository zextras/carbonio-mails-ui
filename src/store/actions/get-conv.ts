/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { normalizeConversation } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import { Conversation } from '../../types/conversation';
import { IncompleteMessage } from '../../types/mail-message';
import { GetConvRequest, GetConvResponse } from '../../types/soap/';

export type GetConvParameters = {
	conversationId: string;
	fetch?: string;
	folderId?: string;
};

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
		const conversation = normalizeConversation(result.c[0]);
		const messages = map(result.c[0].m, (item) =>
			normalizeMailMessageFromSoap(item, false)
		) as unknown as Array<IncompleteMessage>;
		return { conversation, messages };
	},
	{
		condition: ({ folderId, conversationId }: GetConvParameters, { getState }: any) => {
			if (!folderId) return true;
			return (
				getState().conversations?.expandedStatus[conversationId] !== 'complete' &&
				getState().conversations?.expandedStatus[conversationId] !== 'pending'
			);
		}
	}
);
