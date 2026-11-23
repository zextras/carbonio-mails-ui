/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, within } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';
import { NavigateFunction } from 'react-router-dom';

import { setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import {
	generateConversation,
	populateConversationInEmailStore
} from '__test__/generators/generateConversation';
import { generateMessage, populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import {
	handleNotifyConversationsCreated,
	handleNotifyDeleted,
	handleNotifyMessagesCreated,
	handleNotifyMessagesModified,
	updateConversationStatus
} from 'store/emails/store';
import { ConversationPreviewPanelContainer } from 'views/app/detail-panel/conversation-preview-panel-container';

const mockNavigateSpy = vi.fn();
const CONVERSATION_ROUTE_PATH = '/folder/:folderId/conversation/:conversationId';

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useNavigate: (): NavigateFunction => mockNavigateSpy
}));

describe('ConversationPreviewPanelContainer', () => {
	const defaultTitle = 'test title';

	beforeEach(() => {
		document.title = defaultTitle;
	});

	it('should show a loading message and spinner if the conversation is not ready', async () => {
		const { conversation: mockedConversation, messages: mockedMessages } = await act(() =>
			populateConversationInEmailStore()
		);
		await act(() => updateConversationStatus(mockedConversation.id, 'pending'));
		setupTest(<ConversationPreviewPanelContainer />, {
			initialEntries: [`/folder/${mockedMessages[0].parent}/conversation/${mockedConversation.id}`],
			path: CONVERSATION_ROUTE_PATH
		});

		expect(screen.getByText(/Loading conversation, please wait.../i)).toBeVisible();
	});

	describe('should show panel if the conversation has messages', () => {
		it('in focus mode', async () => {
			vi.mocked(shell).IS_FOCUS_MODE = true;
			populateFoldersStore();
			const { conversation: mockedConversation, messages: mockedMessages } = await act(() =>
				populateConversationInEmailStore()
			);
			await act(() => updateConversationStatus(mockedConversation.id, 'fulfilled'));
			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: [
					`/folder/${mockedMessages[0].parent}/conversation/${mockedConversation.id}`
				],
				path: CONVERSATION_ROUTE_PATH
			});

			expect(screen.getByTestId(`PreviewPanelHeader`)).toBeVisible();
		});

		it('in trash with trash messages', async () => {
			vi.mocked(shell).IS_FOCUS_MODE = false;
			const { conversation: mockedConversation, messages: mockedMessages } = await act(() =>
				populateConversationInEmailStore({ conversationParams: { folderId: '3' } })
			);
			await act(() => updateConversationStatus(mockedConversation.id, 'fulfilled'));
			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: [
					`/folder/${mockedMessages[0].parent}/conversation/${mockedConversation.id}`
				],
				path: CONVERSATION_ROUTE_PATH
			});

			expect(screen.getByTestId(`PreviewPanelHeader`)).toBeVisible();
		});
	});

	it('should not set the window title if the focus mode is disabled', async () => {
		vi.mocked(shell).IS_FOCUS_MODE = false;
		const { conversation: mockedConversation, messages: mockedMessages } = await act(() =>
			populateConversationInEmailStore()
		);

		setupTest(<ConversationPreviewPanelContainer />, {
			initialEntries: [`/folder/${mockedMessages[0].parent}/conversation/${mockedConversation.id}`],
			path: CONVERSATION_ROUTE_PATH
		});

		expect(document.title).toEqual(defaultTitle);
	});

	it('should set the window title to the message subject if the focus mode is enabled', async () => {
		vi.mocked(shell).IS_FOCUS_MODE = true;
		const { conversation: mockedConversation, messages: mockedMessages } = await act(() =>
			populateConversationInEmailStore()
		);

		setupTest(<ConversationPreviewPanelContainer />, {
			initialEntries: [`/folder/${mockedMessages[0].parent}/conversation/${mockedConversation.id}`],
			path: CONVERSATION_ROUTE_PATH
		});

		expect(document.title).toEqual(mockedConversation.subject);
	});

	describe('when the conversation id is virtual (single message conversation)', () => {
		const virtualConversationRoute = '/folder/2/conversation/-1';

		it('should navigate to the new conversation id when the message has been moved into a new conversation', async () => {
			await act(() =>
				populateMessagesInEmailStore({
					messageGeneratorParams: [{ id: '1', cid: '2', folderId: '2' }]
				})
			);

			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: [virtualConversationRoute],
				path: CONVERSATION_ROUTE_PATH
			});

			expect(mockNavigateSpy).toHaveBeenCalledWith('../2', { replace: true, relative: 'path' });
		});

		it('should not navigate when the message still belongs to the virtual conversation', async () => {
			const { conversation } = await act(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '-1', folderId: '2' },
					messageIds: ['1']
				})
			);
			await act(() => updateConversationStatus(conversation.id, 'fulfilled'));

			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: [virtualConversationRoute],
				path: CONVERSATION_ROUTE_PATH
			});

			expect(mockNavigateSpy).not.toHaveBeenCalled();
		});

		it('should keep the message being read open, without reloading the panel, when the first reply arrives', async () => {
			vi.mocked(shell).IS_FOCUS_MODE = false;
			populateFoldersStore();
			const { conversation } = await act(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '-1', folderId: '2', receiveDate: Date.now() - 60_000 },
					messageIds: ['1']
				})
			);
			await act(() => updateConversationStatus(conversation.id, 'fulfilled'));
			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: [virtualConversationRoute],
				path: CONVERSATION_ROUTE_PATH
			});
			const messageBeingRead = await screen.findByTestId('MailPreview-1');
			expect(within(messageBeingRead).getByTestId('MailMessageRendererCollapse')).toBeVisible();

			// the notification of the first reply: the server replaces the virtual conversation with a new one
			await act(async () => {
				handleNotifyConversationsCreated([
					generateConversation({ id: '2', messageIds: ['1', '3'], receiveDate: Date.now() })
				]);
				handleNotifyMessagesCreated([generateMessage({ id: '3', cid: '2', folderId: '2' })]);
				handleNotifyMessagesModified([{ id: '1', conversation: '2' }]);
				handleNotifyDeleted(['-1']);
			});

			expect(await screen.findByTestId('MailPreview-3')).toBeInTheDocument();
			expect(screen.getByTestId('MailPreview-1')).toBe(messageBeingRead);
			expect(within(messageBeingRead).getByTestId('MailMessageRendererCollapse')).toBeVisible();
		});
	});
});
