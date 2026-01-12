/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { waitFor, within } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { TESTID_SELECTORS } from '../../__test__/constants';
import {
	stubGetConversation,
	stubSearchConversation,
	stubSearchConversations
} from '../../__test__/conversation/api-stub';
import { conversationTestUtilities } from '../../__test__/conversation/ui-interactions';
import {
	generateConversationFromAPI,
	generateConvMessageFromAPI
} from '../../__test__/generators/api';
import { mockLayoutStorage } from '../../__test__/layouts-utils';
import { setupViewByConversation } from '../../__test__/setup-utils';
import { MAILS_VIEW_LAYOUTS, MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS } from '../../constants';
import AppView from '../app-view';
import { makeAllItemsVisible } from '../settings/filters/tests/test-utils';
import { screen, setupTest, UserEvent } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';

const waitForLazySpinnerToDisappear = (): Promise<void> =>
	waitFor(
		() => {
			expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
		},
		{ timeout: 10000 }
	);

const setupAppView = async (atUrl: string): Promise<UserEvent> => {
	const { user } = setupTest(<AppView />, {
		initialEntries: [atUrl]
	});
	await waitForLazySpinnerToDisappear();
	return user;
};
describe('AppView in conversation mode', () => {
	beforeEach(() => {
		mockLayoutStorage({
			layout: MAILS_VIEW_LAYOUTS.SPLIT,
			splitOrientation: MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL
		});
		populateFoldersStore();
	});
	describe('Conversations', () => {
		beforeEach(() => {
			setupViewByConversation();
		});
		const spamFolderId = `${FOLDERS.SPAM}`;
		const inboxFolderId = `${FOLDERS.INBOX}`;

		describe('Trash conversation', () => {
			it('should close panel when deleting conversation from Inbox', async () => {
				const conversationMessages = [generateConvMessageFromAPI({ l: inboxFolderId, id: '1' })];
				const conversation = generateConversationFromAPI({
					id: '123',
					m: conversationMessages
				});

				stubSearchConversations({ conversations: [conversation] });
				stubSearchConversation({ conversation });
				stubGetConversation({ conversation });
				const user = await setupAppView(`/folder/${inboxFolderId}/conversation/123`);

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
				const conversation1Messages = [generateConvMessageFromAPI({ l: inboxFolderId, id: '1' })];
				const conversation2Messages = [
					generateConvMessageFromAPI({ l: inboxFolderId, id: inboxFolderId })
				];

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
				const user = await setupAppView(`/folder/${inboxFolderId}/conversation/123`);
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
				const user = await setupAppView(`/folder/${inboxFolderId}/conversation/123`);
				const conversation1Ui = conversationTestUtilities('123');
				await conversation1Ui.findConversationInList();
				await conversation1Ui.checkPanelOpen();
				makeAllItemsVisible();
				const contextMenu = await conversation1Ui.openConversationContextMenu(user);
				const markAsSpamAction = await contextMenu.markAsSpam();
				createSoapAPIInterceptor('ConvAction');
				await user.click(markAsSpamAction);
				await conversation1Ui.snackbars.seeConversationMovedToSpam({ status: 'open' });
				await conversation1Ui.snackbars.seeConversationMovedToSpam({ status: 'closed' });
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
				const user = await setupAppView(`/folder/${inboxFolderId}/conversation/123`);
				const openedConversation = conversationTestUtilities('123');
				const otherConversation = conversationTestUtilities('456');

				await openedConversation.checkPanelOpen();

				makeAllItemsVisible();
				const contextMenu = await otherConversation.openConversationContextMenu(user);
				const markAsSpamAction = await contextMenu.markAsSpam();
				createSoapAPIInterceptor('ConvAction');
				await user.click(markAsSpamAction);

				await otherConversation.snackbars.seeConversationMovedToSpam({ status: 'open' });
				await otherConversation.snackbars.seeConversationMovedToSpam({ status: 'closed' });
				await openedConversation.checkPanelOpen();
			});
		});

		describe('Not Spam', () => {
			it('should close detail panel when marking opened conversation as not spam from Spam', async () => {
				const conversationMessages = [generateConvMessageFromAPI({ l: spamFolderId, id: '1' })];
				const conversation = generateConversationFromAPI({
					id: '123',
					m: conversationMessages
				});
				stubSearchConversations({ conversations: [conversation] });
				stubSearchConversation({ conversation });
				stubGetConversation({ conversation });
				const user = await setupAppView(`/folder/${spamFolderId}/conversation/123`);

				const conversation1Ui = conversationTestUtilities('123');
				await conversation1Ui.findConversationInList();
				await conversation1Ui.checkPanelOpen();
				makeAllItemsVisible();
				const contextMenu = await conversation1Ui.openConversationContextMenu(user);
				const notSpamAction = await contextMenu.notSpam();
				createSoapAPIInterceptor('ConvAction');
				await user.click(notSpamAction);
				await conversation1Ui.snackbars.seeConversationNotSpamAnymore({ status: 'open' });
				await conversation1Ui.snackbars.seeConversationNotSpamAnymore({ status: 'closed' });

				await conversation1Ui.checkPanelClosed();
			});
			it('should not close the detail panel for opened conversation when marking a different conversation as not spam', async () => {
				const conversation1Messages = [generateConvMessageFromAPI({ l: spamFolderId, id: '1' })];
				const conversation2Messages = [generateConvMessageFromAPI({ l: spamFolderId, id: '2' })];

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
				const user = await setupAppView(`/folder/${spamFolderId}/conversation/123`);
				const openedConversation = conversationTestUtilities('123');
				const otherConversation = conversationTestUtilities('456');

				await openedConversation.checkPanelOpen();

				makeAllItemsVisible();
				const contextMenu = await otherConversation.openConversationContextMenu(user);
				const notSpamAction = await contextMenu.notSpam();
				createSoapAPIInterceptor('ConvAction');
				await user.click(notSpamAction);

				await otherConversation.snackbars.seeConversationNotSpamAnymore({ status: 'open' });
				await otherConversation.snackbars.seeConversationNotSpamAnymore({ status: 'closed' });
				await openedConversation.checkPanelOpen();
			});
		});
	});
});
