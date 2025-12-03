/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';

import { setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { updateConversationStatus } from 'store/emails/store';
import { ConversationPreviewPanelContainer } from 'views/app/detail-panel/conversation-preview-panel-container';

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
});
