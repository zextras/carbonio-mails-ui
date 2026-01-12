/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { configure, screen, waitFor, within } from '@testing-library/react';

import { TESTID_SELECTORS } from '../../__test__/constants';
import {
	stubGetConversation,
	stubSearchConversation,
	stubSearchConversations
} from '../../__test__/conversation/api-stub';
import { conversationTestUtilities } from '../../__test__/conversation/ui-interactions';
import {
	generateConversationFromAPI,
	generateConvMessageFromAPI,
	generateMessageFromAPI
} from '../../__test__/generators/api';
import { mockLayoutStorage } from '../../__test__/layouts-utils';
import { stubSearchMessages } from '../../__test__/message/api-stub';
import { setupViewByConversation, setupViewByMessage } from '../../__test__/setup-utils';
import { MAILS_VIEW_LAYOUTS, MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS } from '../../constants';
import AppView from '../app-view';
import { makeAllItemsVisible } from '../settings/filters/tests/test-utils';
import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';

describe('AppView', () => {
	beforeAll(() => {
		configure({ asyncUtilTimeout: 5000 });
	});
	beforeEach(() => {
		mockLayoutStorage({
			layout: MAILS_VIEW_LAYOUTS.SPLIT,
			splitOrientation: MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL
		});
		populateFoldersStore();
	});
	describe('Messages', () => {
		it('should display received messages on app load', async () => {
			setupViewByMessage();
			const incompleteMessage = generateMessageFromAPI({
				id: '123',
				su: 'Test message 1',
				l: '2',
				fr: 'Test m'
			});
			stubSearchMessages({ messages: [incompleteMessage] });
			setupTest(<AppView />, {
				initialEntries: [`/folder/2`]
			});

			// lazy components need longer timeout
			await screen.findByTestId('message-item-123', {}, { timeout: 10000 });
			makeAllItemsVisible();
			expect(await screen.findByText('Test message 1')).toBeInTheDocument();
		});
	});

	describe('Conversations', () => {
		beforeEach(() => {
			setupViewByConversation();
		});

		describe('Trash conversation', () => {
			it('should close panel when deleting conversation from Inbox', async () => {
				const conversationMessages = [generateConvMessageFromAPI({ l: '2', id: '1' })];
				const conversation = generateConversationFromAPI({
					id: '123',
					m: conversationMessages
				});

				stubSearchConversations({ conversations: [conversation] });
				stubSearchConversation({ conversation });
				stubGetConversation({ conversation });
				const { user } = setupTest(<AppView />, {
					initialEntries: [`/folder/2/conversation/123`]
				});

				const conversation1Ui = conversationTestUtilities('123');
				await conversation1Ui.findConversationInList();
				await conversation1Ui.checkPanelOpen();
				makeAllItemsVisible();
				const { hoverActionsContainer } = await conversation1Ui.hoverConversationInList(user);
				const deleteConversationButton = await within(hoverActionsContainer).findByTestId(
					TESTID_SELECTORS.icons.trash
				);
				createSoapAPIInterceptor('ConvAction');
				await user.click(deleteConversationButton);
				await conversation1Ui.checkPanelClosed();
			});

			it('should not close the panel when deleting a different conversation', async () => {
				const conversation1Messages = [generateConvMessageFromAPI({ l: '2', id: '1' })];
				const conversation2Messages = [generateConvMessageFromAPI({ l: '2', id: '2' })];

				const conversation1 = generateConversationFromAPI({
					id: '123',
					m: conversation1Messages
				});
				const conversation2 = generateConversationFromAPI({
					id: '456',
					m: conversation2Messages
				});

				stubSearchConversations({ conversations: [conversation1, conversation2] });
				stubSearchConversation({ conversation: conversation1 });
				stubGetConversation({ conversation: conversation1 });
				const { user } = setupTest(<AppView />, {
					initialEntries: [`/folder/2/conversation/123`]
				});
				const conversation1Ui = conversationTestUtilities('123');
				const conversation2Ui = conversationTestUtilities('456');

				await conversation1Ui.checkPanelOpen();

				// delete conversation 2 which is not opened in the panel
				makeAllItemsVisible();
				const { hoverActionsContainer } = await conversation2Ui.hoverConversationInList(user);
				const deleteConversationButton = await within(hoverActionsContainer).findByTestId(
					TESTID_SELECTORS.icons.trash
				);
				createSoapAPIInterceptor('ConvAction');
				await user.click(deleteConversationButton);
				// check panel for conversation1 is still open
				await conversation1Ui.checkPanelOpen();
			});
		});

		describe('Mark as Spam', () => {
			it('should close detail panel when marking opened conversation as spam from Inbox', async () => {
				const conversationMessages = [generateConvMessageFromAPI({ l: '2', id: '1' })];
				const conversation = generateConversationFromAPI({
					id: '123',
					m: conversationMessages
				});

				stubSearchConversations({ conversations: [conversation] });
				stubSearchConversation({ conversation });
				stubGetConversation({ conversation });
				const { user } = setupTest(<AppView />, {
					initialEntries: [`/folder/2/conversation/123`]
				});

				const conversation1Ui = conversationTestUtilities('123');
				await conversation1Ui.findConversationInList();
				await conversation1Ui.checkPanelOpen();
				makeAllItemsVisible();
				const contextMenu = await conversation1Ui.openConversationContextMenu(user);
				const markAsSpamAction = await within(contextMenu).findByText('Mark as spam');
				createSoapAPIInterceptor('ConvAction');
				await user.click(markAsSpamAction);
				await conversation1Ui.checkPanelClosed();
			});

			it('should not close the detail panel for opened conversation when marking a different conversation as spam', async () => {
				const conversation1Messages = [generateConvMessageFromAPI({ l: '2', id: '1' })];
				const conversation2Messages = [generateConvMessageFromAPI({ l: '2', id: '2' })];

				const conversation1 = generateConversationFromAPI({
					id: '123',
					m: conversation1Messages
				});
				const conversation2 = generateConversationFromAPI({
					id: '456',
					m: conversation2Messages
				});

				stubSearchConversations({ conversations: [conversation1, conversation2] });
				stubSearchConversation({ conversation: conversation1 });
				stubGetConversation({ conversation: conversation1 });
				const { user } = setupTest(<AppView />, {
					initialEntries: [`/folder/2/conversation/123`]
				});
				const openedConversation = conversationTestUtilities('123');
				const otherConversation = conversationTestUtilities('456');

				await openedConversation.checkPanelOpen();

				// mark as spam conversation 2 which is not opened in the detail panel
				makeAllItemsVisible();
				const contextMenuOfOtherConversation =
					await otherConversation.openConversationContextMenu(user);
				const markAsSpamAction = await within(contextMenuOfOtherConversation).findByText(
					'Mark as spam'
				);

				await user.click(markAsSpamAction);

				createSoapAPIInterceptor('ConvAction');
				await screen.findByText('You’ve marked this e-mail as Spam');
				await waitFor(() => {
					expect(screen.queryByText('You’ve marked this e-mail as Spam')).not.toBeInTheDocument();
				});

				// check detail panel for opened Conversation is still open
				await openedConversation.checkPanelOpen();
			});
		});
	});
});
