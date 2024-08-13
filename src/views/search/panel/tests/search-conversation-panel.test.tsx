/* eslint-disable @typescript-eslint/no-use-before-define */
import React from 'react';

import { act, within } from '@testing-library/react';
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as hooks from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import produce from 'immer';
import { noop } from 'lodash';
/* eslint-disable no-param-reassign */
import { useParams } from 'react-router-dom';

import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { useFolderStore } from '../../../../carbonio-ui-commons/store/zustand/folder';
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
import {
	setConversations,
	updateConversationStatus,
	setMessages
} from '../../../../store/zustand/message-store/store';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../tests/generators/store';
import { SearchConvRequest, SearchConvResponse, SoapMailMessage } from '../../../../types';
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
		setConversations([generateConversation({ id: '123', folderId: FOLDERS.INBOX })], 0);
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
		setConversations([generateConversation({ id: '123', folderId: FOLDERS.INBOX })], 0);
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
		setConversations([generateConversation({ id: '123', folderId: FOLDERS.INBOX })], 0);
		const interceptor = createSoapAPIInterceptorWithError('SearchConv');

		setupTest(<SearchConversationPanel />, { store });

		await interceptor;
		expect(screen.queryByTestId(/MailPreview-1/)).not.toBeInTheDocument();
		expect(await screen.findByTestId('empty-fragment')).toBeInTheDocument();
	});

	it('should render a shimmer component when SearchConv API call is pending', async () => {
		(useParams as jest.Mock).mockReturnValue({ conversationId: '123', folderId: FOLDERS.INBOX });
		const conversation = generateConversation({ id: '123', folderId: FOLDERS.INBOX });
		setConversations([conversation], 0);
		updateConversationStatus(conversation.id, API_REQUEST_STATUS.pending);

		setupTest(<SearchConversationPanel />, { store });

		expect(screen.getByTestId('shimmer-conversation-123')).toBeInTheDocument();
	});

	it('should show message body on opened messages only if they are complete', async () => {
		(useParams as jest.Mock).mockReturnValue({ conversationId: '123', folderId: FOLDERS.INBOX });
		const message2 = generateMessage({
			id: '2',
			folderId: FOLDERS.INBOX,
			body: 'Message Body 2',
			isComplete: false
		});
		const message1 = generateMessage({
			id: '1',
			folderId: FOLDERS.INBOX,
			body: 'Message Body 1',
			isComplete: true
		});
		const conversation = generateConversation({
			id: '123',
			folderId: FOLDERS.INBOX,
			messages: [message1, message2]
		});
		setConversations([conversation], 0);
		updateConversationStatus(conversation.id, API_REQUEST_STATUS.fulfilled);
		setMessages([message1, message2], 0);

		const { user } = setupTest(<SearchConversationPanel />, { store });
		const mail2ClosedPanel = await screen.findByTestId(/open-message-2/);
		await act(() => user.click(mail2ClosedPanel));

		const mail1Panel = await screen.findByTestId(/MailPreview-1/);
		const mail2Panel = await screen.findByTestId(/MailPreview-2/);
		expect(await within(mail1Panel).findByText('Message Body 1')).toBeVisible();
		expect(within(mail2Panel).queryByText('Message Body 2')).not.toBeInTheDocument();
	});

	describe('Actions', () => {
		const setupMocks = (conversationId: string): void => {
			useFolderStore.setState(
				produce((initialState) => {
					initialState.folders = generateFolders();
				})
			);
			jest.spyOn(hooks, 'useAppContext').mockReturnValue({ setCount: noop });
			jest.spyOn(visibleActionsCount, 'useVisibleActionsCount').mockReturnValue([16, noop]);
			(useParams as jest.Mock).mockReturnValue({ conversationId });
		};

		it('should display actions only on opened messages', async () => {
			const message1 = generateMessage({ id: '1', folderId: '2', body: 'Body 1' });
			const message2 = generateMessage({ id: '2', folderId: '2', body: 'Body 2' });
			const conversation = generateConversation({
				id: '123',
				folderId: FOLDERS.INBOX,
				messages: [message1, message2]
			});
			setConversations([conversation], 0);
			updateConversationStatus(conversation.id, API_REQUEST_STATUS.fulfilled);
			setMessages([message1, message2], 0);
			setupMocks('123');

			setupTest(<SearchConversationPanel />, { store });

			const mail1PanelOpened = await screen.findByTestId(/MailPreview-1/);
			const mail2PanelClosed = await screen.findByTestId(/MailPreview-2/);
			expect(await within(mail1PanelOpened).findByTestId('icon: Trash2Outline')).toBeVisible();
			expect(within(mail2PanelClosed).queryByTestId('icon: Trash2Outline')).not.toBeInTheDocument();
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
