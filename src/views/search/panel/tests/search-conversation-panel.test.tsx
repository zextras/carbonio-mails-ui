/* eslint-disable @typescript-eslint/no-use-before-define */
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
import { FOLDERS } from '../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { generateFolders } from '../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '../../../../carbonio-ui-commons/test/mocks/utils/soap';
import { screen, setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	createSoapAPIInterceptorWithError,
	generateConvMessageFromAPI,
	generateMessagePartFromAPI
} from '../../../../helpers/api';
import * as visibleActionsCount from '../../../../hooks/use-visible-actions-count';
import { useMessageStore } from '../../../../store/zustand/message-store/store';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../tests/generators/store';
import {
	Conversation,
	MsgActionRequest,
	MsgActionResponse,
	SearchConvRequest,
	SearchConvResponse,
	SearchRequestStatus,
	SoapMailMessage
} from '../../../../types';
import { SearchConversationPanel } from '../search-conversation-panel';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

describe('Conversation Preview', () => {
	let store: ReturnType<typeof generateStore>;

	beforeEach(() => {
		store = generateStore();
	});

	it('should render a conversation with its messages when SearchConv API returns a valid response', async () => {
		(useParams as jest.Mock).mockReturnValue({ conversationId: '123', folderId: FOLDERS.INBOX });
		addConversationInStore(generateConversation({ id: '123', folderId: FOLDERS.INBOX }));
		const interceptor = createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>(
			'SearchConv',
			searchConversationFromApi([
				textConversationMessageFromAPI('1', 'Test Message body'),
				textConversationMessageFromAPI('10', 'Another message')
			])
		);

		setupTest(<SearchConversationPanel />, { store });

		await interceptor;
		expect(await screen.findAllByTestId(/MailPreview-/)).toHaveLength(2);
		expect(await screen.findByTestId('MailPreview-10')).toBeVisible();
		expect(await screen.findByText('Test Message body')).toBeInTheDocument();
	});

	it('should render an empty fragment when SearchConv API call returns Fault', async () => {
		(useParams as jest.Mock).mockReturnValue({ conversationId: '123', folderId: FOLDERS.INBOX });
		addConversationInStore(generateConversation({ id: '123', folderId: FOLDERS.INBOX }));
		const interceptor = createSoapAPIInterceptor<SearchConvRequest, ErrorSoapBodyResponse>(
			'SearchConv',
			buildSoapErrorResponseBody()
		);

		setupTest(<SearchConversationPanel />, { store });

		await interceptor;
		expect(screen.queryByTestId(/MailPreview-1/)).not.toBeInTheDocument();
		expect(await screen.findByTestId('empty-fragment')).toBeInTheDocument();
	});

	it('should render an empty fragment when SearchConv API call throws an error', async () => {
		(useParams as jest.Mock).mockReturnValue({ conversationId: '123', folderId: FOLDERS.INBOX });
		addConversationInStore(generateConversation({ id: '123', folderId: FOLDERS.INBOX }));
		const interceptor = createSoapAPIInterceptorWithError('SearchConv');

		setupTest(<SearchConversationPanel />, { store });

		await interceptor;
		expect(screen.queryByTestId(/MailPreview-1/)).not.toBeInTheDocument();
		expect(await screen.findByTestId('empty-fragment')).toBeInTheDocument();
	});

	it('should render a shimmer component when SearchConv API call is pending', async () => {
		(useParams as jest.Mock).mockReturnValue({ conversationId: '123', folderId: FOLDERS.INBOX });
		addConversationInStore(generateConversation({ id: '123', folderId: FOLDERS.INBOX }), {
			'123': API_REQUEST_STATUS.pending
		});

		setupTest(<SearchConversationPanel />, { store });

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
			(useParams as jest.Mock).mockReturnValue({ conversationId: '123', folderId: FOLDERS.INBOX });
		});

		it('should display "Trash" badge on single message deleting it', async () => {
			const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				{ action: { id: '345', op: 'trash' } }
			);
			const conversation = generateConversation({
				id: '123',
				folderId: FOLDERS.INBOX,
				messages: [generateMessage({ id: '1', folderId: '2' })]
			});
			addConversationInStore(conversation, { '123': API_REQUEST_STATUS.fulfilled });
			const { user } = setupTest(<SearchConversationPanel />, { store });
			const mail1Panel = await screen.findByTestId(/MailPreview-1/);

			const trashButton = await within(mail1Panel).findByTestId('icon: Trash2Outline');
			await act(() => user.click(trashButton));

			await msgActionInterceptor;
			expect(await within(mail1Panel).findByText(/folders\.trash/i)).toBeVisible();
		});
	});
});

function searchConversationFromApi(messages: Array<SoapMailMessage>): SearchConvResponse {
	return {
		m: messages,
		more: false,
		offset: '',
		orderBy: ''
	};
}

function textConversationMessageFromAPI(id: string, content: string): SoapMailMessage {
	return generateConvMessageFromAPI({
		id,
		mp: [
			generateMessagePartFromAPI({
				part: '1',
				ct: 'text/plain',
				body: true,
				content
			})
		]
	});
}

function addConversationInStore(
	conversation: Conversation,
	status: Record<string, SearchRequestStatus> = {}
): void {
	const messages = Object.fromEntries(conversation.messages.map((msg) => [msg.id, msg]));

	useMessageStore.setState(
		produce((initialState) => {
			initialState.search.conversationIds = new Set([conversation.id]);
			initialState.populatedItems.conversations = { [conversation.id]: conversation };
			initialState.populatedItems.conversationsStatus = status;
			initialState.populatedItems.messages = messages;
		})
	);
}