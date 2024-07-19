/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { noop } from 'lodash';
import { useParams } from 'react-router-dom';

import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../../constants';
import { useMessageStore } from '../../../../store/zustand/message-store/store';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../tests/generators/store';
import { PopulatedItemsSliceState, SearchSliceState } from '../../../../types';
import { SearchConversationPanel } from '../search-conversation-panel';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

describe('Conversation Preview', () => {
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

	it('should render a conversation with its messages', async () => {
		const initialState = { ...searchSliceState, ...populatedItemsSliceState };
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
