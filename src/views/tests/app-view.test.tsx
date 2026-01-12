/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';

import { TESTID_SELECTORS } from '../../__test__/constants';
import { conversationTestUtilities } from '../../__test__/conversation-utils/ui-interactions';
import {
	generateConversationFromAPI,
	generateConvMessageFromAPI,
	generateMessageFromAPI
} from '../../__test__/generators/api';
import { mockLayoutStorage } from '../../__test__/layouts-utils';
import { MAILS_VIEW_LAYOUTS, MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS } from '../../constants';
import {
	GetConvRequest,
	GetConvResponse,
	SearchConvRequest,
	SearchConvResponse,
	SearchRequest,
	SearchResponse
} from '../../types';
import AppView from '../app-view';
import { makeAllItemsVisible } from '../settings/filters/tests/test-utils';
import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { populateFoldersStore } from '@test-utils/store/folders';

describe('AppView', () => {
	beforeEach(() => {
		mockLayoutStorage({
			layout: MAILS_VIEW_LAYOUTS.SPLIT,
			splitOrientation: MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL
		});
		populateFoldersStore();
	});
	it('should display received messages on app load', async () => {
		const settings = generateSettings({
			prefs: {
				zimbraPrefGroupMailBy: 'message'
			}
		});
		vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		const incompleteMessage = generateMessageFromAPI({
			id: '123',
			su: 'Test message 1',
			l: '2',
			fr: 'Test m'
		});
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			more: false,
			m: [incompleteMessage]
		});
		setupTest(<AppView />, {
			initialEntries: [`/folder/2`]
		});

		// lazy components need longer timeout
		await screen.findByTestId('message-item-123', {}, { timeout: 10000 });
		makeAllItemsVisible();
		expect(await screen.findByText('Test message 1')).toBeInTheDocument();
	});

	describe('Conversations', () => {
		beforeEach(() => {
			const settings = generateSettings({
				prefs: {
					zimbraPrefGroupMailBy: 'conversation'
				}
			});
			vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		});
		it('should close panel when deleting conversation from Inbox', async () => {
			const conversation1Messages = [generateConvMessageFromAPI({ l: '2', id: '1' })];
			const conversation1 = generateConversationFromAPI({
				id: '123',
				m: conversation1Messages
			});

			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				more: false,
				c: [conversation1]
			});

			createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', {
				m: conversation1Messages,
				more: false,
				offset: '',
				orderBy: ''
			});
			createSoapAPIInterceptor<GetConvRequest, GetConvResponse>('GetConv', {
				c: [conversation1]
			});
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

			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				more: false,
				c: [conversation1, conversation2]
			});

			createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', {
				m: conversation1Messages,
				more: false,
				offset: '',
				orderBy: ''
			});

			createSoapAPIInterceptor<GetConvRequest, GetConvResponse>('GetConv', {
				c: [conversation1]
			});
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
});
