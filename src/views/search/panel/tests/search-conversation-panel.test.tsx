/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { noop } from 'lodash';
import { useParams } from 'react-router-dom';

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../../constants';
import { generateConversationFromAPI, generateConvMessageFromAPI } from '../../../../helpers/api';
import { MessageStoreState, useMessageStore } from '../../../../store/zustand/message-store/store';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../tests/generators/store';
import { GetConvResponse, PopulatedItemsSliceState, SearchSliceState } from '../../../../types';
import { SearchConversationPanel } from '../search-conversation-panel';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

function generateInitialStoreState(): MessageStoreState {
	const searchSliceState: SearchSliceState = {
		search: {
			conversationIds: new Set(),
			messageIds: new Set(),
			more: false,
			offset: 0,
			status: API_REQUEST_STATUS.fulfilled
		}
	};
	const populatedItemsSliceState: PopulatedItemsSliceState = {
		populatedItems: {
			messages: {},
			conversations: {}
		},
		actions: {
			updateMessages: noop,
			updateConversations: noop
		}
	};
	return { ...searchSliceState, ...populatedItemsSliceState };
}

describe('Conversation Preview', () => {
	describe('when the conversation is in the store', () => {
		it('should render a conversation with its messages', async () => {
			const initialState = generateInitialStoreState();
			initialState.search.conversationIds = new Set(['123']);
			const message1 = generateMessage({ id: '1', subject: 'Test Message 1' });
			const message2 = generateMessage({ id: '2', subject: 'AAAAAAAAAA' });

			const conversation = generateConversation({
				id: '123',
				messages: [message1, message2],
				subject: 'Test Conversation'
			});
			initialState.populatedItems.conversations = { '123': conversation };
			initialState.populatedItems.messages = { '1': message1, '2': message2 };
			useMessageStore.setState({
				...initialState
			});
			(useParams as jest.Mock).mockReturnValue({ folderId: '2' });

			const store = generateStore();
			setupTest(<SearchConversationPanel conversationId="123" folderId="2" />, { store });

			expect(await screen.findByTestId('MailPreview-1')).toBeVisible();
			expect(await screen.findByTestId('MailPreview-2')).toBeVisible();
		});
	});

	describe('when the conversation is not in the store', () => {
		it('should render a conversation with its messages', async () => {
			const initialState = generateInitialStoreState();
			useMessageStore.setState({
				...initialState
			});
			(useParams as jest.Mock).mockReturnValue({ folderId: '2' });

			const conversation = generateConversationFromAPI({
				id: '123',
				m: [generateConvMessageFromAPI({ id: '1' }), generateConvMessageFromAPI({ id: '2' })],
				su: 'Test Conversation'
			});
			const response: GetConvResponse = {
				c: [conversation]
			};
			const interceptor = createSoapAPIInterceptor('GetConvRequest', response);
			const store = generateStore();
			setupTest(<SearchConversationPanel conversationId="123" folderId="2" />, { store });
			await interceptor;

			expect(await screen.findByTestId('MailPreview-1')).toBeVisible();
		});
	});
});
