/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, within } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';
import { useTagStore } from '@zextras/carbonio-ui-commons';
import { NavigateFunction } from 'react-router-dom';

import { setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { updateConversationStatus } from 'store/emails/store';
import { ConversationPreviewPanelContainer } from 'views/app/detail-panel/conversation-preview-panel-container';

const mockNavigateSpy = vi.fn();

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
			path: '/folder/:folderId/conversation/:conversationId'
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
				path: '/folder/:folderId/conversation/:conversationId'
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
				path: '/folder/:folderId/conversation/:conversationId'
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
			path: '/folder/:folderId/conversation/:conversationId'
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
			path: '/folder/:folderId/conversation/:conversationId'
		});

		expect(document.title).toEqual(mockedConversation.subject);
	});

	describe('when the conversation id is virtual (single message conversation)', () => {
		it('should navigate to the new conversation id when the message has been moved into a new conversation', async () => {
			await act(() =>
				populateMessagesInEmailStore({
					messageGeneratorParams: [{ id: '1', cid: '2', folderId: '2' }]
				})
			);

			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: ['/folder/2/conversation/-1'],
				path: '/folder/:folderId/conversation/:conversationId'
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
				initialEntries: ['/folder/2/conversation/-1'],
				path: '/folder/:folderId/conversation/:conversationId'
			});

			expect(mockNavigateSpy).not.toHaveBeenCalled();
		});
	});

	describe('tags under the subject', () => {
		const openConversation = async (
			messages: Array<{ id: string; tags: Array<string> }>
		): Promise<HTMLElement> => {
			vi.mocked(shell).IS_FOCUS_MODE = false;
			useTagStore.setState({
				tags: {
					t1: { id: 't1', name: 'Client', color: 1 },
					t2: { id: 't2', name: 'Urgent', color: 2 }
				}
			});
			const { conversation } = await act(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						folderId: '2',
						// The server's conversation tags: those of any of its messages
						tags: [...new Set(messages.flatMap((message) => message.tags))]
					},
					messageGeneratorParams: messages.map((message) => ({ ...message, folderId: '2' }))
				})
			);
			await act(() => updateConversationStatus(conversation.id, 'fulfilled'));
			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: ['/folder/2/conversation/1'],
				path: '/folder/:folderId/conversation/:conversationId'
			});
			return screen.getByTestId('PreviewPanelHeader');
		};

		it('are those of all its messages, as in the list', async () => {
			const header = await openConversation([
				{ id: '10', tags: ['t2'] },
				{ id: '11', tags: ['t1'] }
			]);
			const tags = await within(header).findByTestId('reading-pane-tags');
			expect(tags).toHaveTextContent('Client');
			expect(tags).toHaveTextContent('Urgent');
		});
	});
});
