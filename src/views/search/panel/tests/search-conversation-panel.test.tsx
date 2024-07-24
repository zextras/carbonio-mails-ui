/* eslint-disable no-param-reassign */
import React from 'react';

import { act, waitFor, within } from '@testing-library/react';
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as hooks from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import produce from 'immer';
import { noop } from 'lodash';
import { useParams } from 'react-router-dom';

import { useFolderStore } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { generateFolders } from '../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '../../../../carbonio-ui-commons/test/mocks/utils/soap';
import { screen, setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	createSoapAPIInterceptorWithError,
	generateConvMessageFromAPI
} from '../../../../helpers/api';
import * as visibleActionsCount from '../../../../hooks/use-visible-actions-count';
import { useMessageStore } from '../../../../store/zustand/message-store/store';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../tests/generators/store';
import {
	MsgActionRequest,
	MsgActionResponse,
	SearchConvRequest,
	SearchConvResponse
} from '../../../../types';
import { SearchConversationPanel } from '../search-conversation-panel';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

describe('Conversation Preview', () => {
	it('should render a conversation with its messages when SearchConv API returns a valid response', async () => {
		const message1 = generateMessage({ id: '1', subject: 'Test Message 1' });

		const conversation = generateConversation({
			id: '123',
			messages: [message1],
			subject: 'Test Conversation'
		});
		useMessageStore.setState(
			produce((state) => {
				state.search.conversationIds = new Set(['123']);
				state.populatedItems.conversations = { '123': conversation };
				state.populatedItems.conversationsStatus = {};
				state.populatedItems.messages = { '1': message1 };
			})
		);
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
		const message1 = generateMessage({ id: '1', subject: 'Test Message 1' });

		const conversation = generateConversation({
			id: '123',
			messages: [message1],
			subject: 'Test Conversation'
		});
		useMessageStore.setState(
			produce((initialState) => {
				initialState.search.conversationIds = new Set(['123']);
				initialState.populatedItems.conversations = { '123': conversation };
				initialState.populatedItems.conversationsStatus = {};
				initialState.populatedItems.messages = { '1': message1 };
			})
		);

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
		const message1 = generateMessage({ id: '1', subject: 'Test Message 1' });

		const conversation = generateConversation({
			id: '123',
			messages: [message1],
			subject: 'Test Conversation'
		});
		useMessageStore.setState(
			produce((initialState) => {
				initialState.search.conversationIds = new Set(['123']);
				initialState.populatedItems.conversations = { '123': conversation };
				initialState.populatedItems.conversationsStatus = {};
				initialState.populatedItems.messages = { '1': message1 };
			})
		);

		(useParams as jest.Mock).mockReturnValue({ folderId: '2' });

		const interceptor = createSoapAPIInterceptorWithError('SearchConv');
		const store = generateStore();
		setupTest(<SearchConversationPanel conversationId="123" folderId="2" />, { store });
		await interceptor;

		expect(screen.queryByTestId(/MailPreview-1/)).not.toBeInTheDocument();
		expect(await screen.findByTestId('empty-fragment')).toBeInTheDocument();
	});

	it('should render a shimmer component when SearchConv API call is pending', async () => {
		const message1 = generateMessage({ id: '1', subject: 'Test Message 1' });

		const conversation = generateConversation({
			id: '123',
			messages: [message1],
			subject: 'Test Conversation'
		});
		useMessageStore.setState(
			produce((initialState) => {
				initialState.search.conversationIds = new Set(['123']);
				initialState.populatedItems.conversations = { '123': conversation };
				initialState.populatedItems.conversationsStatus = { '123': API_REQUEST_STATUS.pending };
				initialState.populatedItems.messages = { '1': message1 };
			})
		);

		(useParams as jest.Mock).mockReturnValue({ folderId: '2' });

		const store = generateStore();
		setupTest(<SearchConversationPanel conversationId="123" folderId="2" />, { store });

		expect(screen.getByTestId('shimmer-conversation-123')).toBeInTheDocument();
	});

	describe('Actions', () => {
		beforeEach(() => {
			useFolderStore.setState(
				produce((initialState) => {
					initialState.folders = generateFolders();
				})
			);
			jest.spyOn(hooks, 'useAppContext').mockReturnValue({ setCount: noop });
			jest.spyOn(visibleActionsCount, 'useVisibleActionsCount').mockReturnValue([16, noop]);
			(useParams as jest.Mock).mockReturnValue({ folderId: '2', conversationId: '123' });
		});
		it('should display "Trash" badge on single message deleting it', async () => {
			const message1 = generateMessage({ id: '1', subject: 'Test Message 1', folderId: '2' });
			const message2 = generateMessage({ id: '2', subject: 'Test Message 2', folderId: '2' });
			const conversation = generateConversation({
				id: '123',
				folderId: '2',
				messages: [message1, message2],
				subject: 'Test Conversation'
			});
			useMessageStore.setState(
				produce((initialState) => {
					initialState.search.conversationIds = new Set(['123']);
					initialState.populatedItems.conversations = { '123': conversation };
					initialState.populatedItems.messages = { '1': message1, '2': message2 };
				})
			);
			const response: SearchConvResponse = {
				m: [
					generateConvMessageFromAPI({ id: '1', cid: '123' }),
					generateConvMessageFromAPI({ id: '2', cid: '123' })
				],
				more: false,
				offset: '',
				orderBy: ''
			};
			const interceptor = createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>(
				'SearchConv',
				response
			);
			const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				{ action: { id: '123', op: 'trash' } }
			);

			const { user } = setupTest(<SearchConversationPanel />, {
				store: generateStore()
			});

			await interceptor;
			const mail1Panel = await screen.findByTestId(/MailPreview-1/);
			const trashButton = await within(mail1Panel).findByTestId('icon: Trash2Outline');
			expect(trashButton).toBeVisible();
			act(() => {
				user.click(trashButton);
			});
			await msgActionInterceptor;
			await waitFor(() => {
				const messageParent = useMessageStore.getState().populatedItems.messages['1'].parent;
				expect(messageParent).toBe('3');
			});
			expect(await within(mail1Panel).findByText(/folders\.trash/i)).toBeVisible();
		});
		it('should display "Trash" badge on single message conversation when deleting message', async () => {
			const message1 = generateMessage({ id: '1', subject: 'Test Message 1', folderId: '2' });
			const conversation = generateConversation({
				id: '123',
				folderId: '2',
				messages: [message1],
				subject: 'Test Conversation'
			});
			useMessageStore.setState(
				produce((initialState) => {
					initialState.search.conversationIds = new Set(['123']);
					initialState.populatedItems.conversations = { '123': conversation };
					initialState.populatedItems.messages = { '1': message1 };
				})
			);
			const response: SearchConvResponse = {
				m: [generateConvMessageFromAPI({ id: '1', cid: '123' })],
				more: false,
				offset: '',
				orderBy: ''
			};
			const interceptor = createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>(
				'SearchConv',
				response
			);
			const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				{ action: { id: '123', op: 'trash' } }
			);

			const { user } = setupTest(<SearchConversationPanel />, {
				store: generateStore()
			});

			await interceptor;
			const mail1Panel = await screen.findByTestId(/MailPreview-1/);
			const trashButton = await within(mail1Panel).findByTestId('icon: Trash2Outline');
			expect(trashButton).toBeVisible();
			act(() => {
				user.click(trashButton);
			});
			await msgActionInterceptor;
			await waitFor(() => {
				const messageParent = useMessageStore.getState().populatedItems.messages['1'].parent;
				expect(messageParent).toBe('3');
			});
			expect(await within(mail1Panel).findByText(/folders\.trash/i)).toBeVisible();
		});
	});
});
