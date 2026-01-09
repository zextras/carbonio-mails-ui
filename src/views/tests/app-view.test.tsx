/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';

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

		await screen.findByTestId('message-item-123');
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
			const conversation1Messages = [
				generateConvMessageFromAPI({ l: '2', id: '1' }),
				generateConvMessageFromAPI({ l: '2', id: '2' })
			];
			const conversation1 = generateConversationFromAPI({
				id: '123',
				m: conversation1Messages
			});
			const conversation2 = generateConversationFromAPI({
				id: '456',
				m: [generateConvMessageFromAPI({ l: '2', id: '3' })]
			});
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				more: false,
				c: [conversation1, conversation2]
			});

			const response: SearchConvResponse = {
				m: conversation1Messages,
				more: false,
				offset: '',
				orderBy: ''
			};
			createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', response);
			createSoapAPIInterceptor<GetConvRequest, GetConvResponse>('GetConv', {
				c: [conversation1]
			});
			const { user } = setupTest(<AppView />, {
				initialEntries: [`/folder/2/conversation/123`]
			});

			const conversation1Ui = conversationTestUtilities('123');
			// check panel visible
			await conversation1Ui.findConversationInList();
			await conversation1Ui.checkPanelOpen();
			makeAllItemsVisible();
			const { hoverActionsContainer } = await conversation1Ui.hoverConversationInList(user);
			const deleteConversationButton =
				await within(hoverActionsContainer).findByTestId('icon: Trash2Outline');
			createSoapAPIInterceptor('ConvAction');
			await user.click(deleteConversationButton);
			await conversation1Ui.checkPanelClosed();
		});
	});
});
