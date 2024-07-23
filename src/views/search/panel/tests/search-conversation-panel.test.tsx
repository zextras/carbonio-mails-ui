/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '../../../../carbonio-ui-commons/test/mocks/utils/soap';
import { setupTest, screen } from '../../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	createSoapAPIInterceptorWithError,
	generateConvMessageFromAPI
} from '../../../../helpers/api';
import { useMessageStore } from '../../../../store/zustand/message-store/store';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../tests/generators/store';
import { SearchConvRequest, SearchConvResponse } from '../../../../types';
import { SearchConversationPanel } from '../search-conversation-panel';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

describe('Conversation Preview', () => {
	it('should render a conversation with its messages when SearchConv API returns a valid response', async () => {
		const initialState = useMessageStore.getState();
		initialState.search.conversationIds = new Set(['123']);
		const message1 = generateMessage({ id: '1', subject: 'Test Message 1' });

		const conversation = generateConversation({
			id: '123',
			messages: [message1],
			subject: 'Test Conversation'
		});
		initialState.populatedItems.conversations = { '123': conversation };
		initialState.populatedItems.conversationsStatus = {};
		initialState.populatedItems.messages = { '1': message1 };
		useMessageStore.setState({
			...initialState
		});
		(useParams as jest.Mock).mockReturnValue({ folderId: '2' });

		const response: SearchConvResponse = {
			m: [generateConvMessageFromAPI({ id: '10' }), generateConvMessageFromAPI({ id: '2' })],
			more: false,
			offset: '',
			orderBy: ''
		};
		const interceptor = createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>(
			'SearchConv',
			response
		);
		const store = generateStore();
		setupTest(<SearchConversationPanel conversationId="123" folderId="2" />, { store });
		await interceptor;

		expect(await screen.findAllByTestId(/MailPreview-/)).toHaveLength(2);
		expect(await screen.findByTestId('MailPreview-10')).toBeVisible();
	});

	it('should render an empty fragment when SearchConv API call returns Fault', async () => {
		const initialState = useMessageStore.getState();
		initialState.search.conversationIds = new Set(['123']);
		const message1 = generateMessage({ id: '1', subject: 'Test Message 1' });

		const conversation = generateConversation({
			id: '123',
			messages: [message1],
			subject: 'Test Conversation'
		});
		initialState.populatedItems.conversations = { '123': conversation };
		initialState.populatedItems.conversationsStatus = {};
		initialState.populatedItems.messages = { '1': message1 };
		useMessageStore.setState({
			...initialState
		});
		(useParams as jest.Mock).mockReturnValue({ folderId: '2' });

		const interceptor = createSoapAPIInterceptor<SearchConvRequest, ErrorSoapBodyResponse>(
			'SearchConv',
			buildSoapErrorResponseBody()
		);
		const store = generateStore();
		setupTest(<SearchConversationPanel conversationId="123" folderId="2" />, { store });

		await interceptor;

		expect(screen.queryByTestId(/MailPreview-1/)).not.toBeInTheDocument();
		expect(await screen.findByTestId('empty-fragment')).toBeInTheDocument();
	});

	it('should render an empty fragment when SearchConv API call throws an error', async () => {
		const initialState = useMessageStore.getState();
		initialState.search.conversationIds = new Set(['123']);
		const message1 = generateMessage({ id: '1', subject: 'Test Message 1' });

		const conversation = generateConversation({
			id: '123',
			messages: [message1],
			subject: 'Test Conversation'
		});
		initialState.populatedItems.conversations = { '123': conversation };
		initialState.populatedItems.conversationsStatus = {};
		initialState.populatedItems.messages = { '1': message1 };
		useMessageStore.setState({
			...initialState
		});
		(useParams as jest.Mock).mockReturnValue({ folderId: '2' });

		const interceptor = createSoapAPIInterceptorWithError('SearchConv');
		const store = generateStore();
		setupTest(<SearchConversationPanel conversationId="123" folderId="2" />, { store });
		await interceptor;

		expect(screen.queryByTestId(/MailPreview-1/)).not.toBeInTheDocument();
		expect(await screen.findByTestId('empty-fragment')).toBeInTheDocument();
	});

	it('should render a shimmer component when SearchConv API call is pending', async () => {
		const initialState = useMessageStore.getState();
		initialState.search.conversationIds = new Set(['123']);
		const message1 = generateMessage({ id: '1', subject: 'Test Message 1' });

		const conversation = generateConversation({
			id: '123',
			messages: [message1],
			subject: 'Test Conversation'
		});
		initialState.populatedItems.conversations = { '123': conversation };
		initialState.populatedItems.conversationsStatus = { '123': API_REQUEST_STATUS.pending };
		initialState.populatedItems.messages = { '1': message1 };
		useMessageStore.setState({
			...initialState
		});
		(useParams as jest.Mock).mockReturnValue({ folderId: '2' });

		const store = generateStore();
		setupTest(<SearchConversationPanel conversationId="123" folderId="2" />, { store });

		expect(screen.getByTestId('shimmer-conversation-123')).toBeInTheDocument();
	});

	describe('Single conversation mode', () => {
		it('should display "Trash" badge when clicking delete button', async () => {
			const initialState = useMessageStore.getState();
			initialState.search.conversationIds = new Set(['123']);
			const message1 = generateMessage({ id: '1', subject: 'Test Message 1' });
			const conversation = generateConversation({
				id: '123',
				messages: [message1],
				subject: 'Test Conversation'
			});
			initialState.populatedItems.conversations = { '123': conversation };
			initialState.populatedItems.messages = { '1': message1 };
			useMessageStore.setState({
				...initialState
			});
			(useParams as jest.Mock).mockReturnValue({ folderId: '2' });
			const response: SearchConvResponse = {
				m: [generateConvMessageFromAPI({ id: '1' })],
				more: false,
				offset: '',
				orderBy: ''
			};
			const interceptor = createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>(
				'SearchConv',
				response
			);

			const store = generateStore();
			const { user } = setupTest(<SearchConversationPanel conversationId="123" folderId="2" />, {
				store
			});
			await interceptor;
			expect(await screen.findByTestId(/MailPreview-1/)).toBeInTheDocument();
			const trashButton = await screen.findByRoleWithIcon('button', { icon: /Trash2Outline/i });

			act(() => {
				user.click(trashButton);
			});
			expect(trashButton).toBeVisible();
		});
	});
});
