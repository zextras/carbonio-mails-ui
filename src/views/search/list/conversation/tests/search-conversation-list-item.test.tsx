/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { screen, waitFor } from '@testing-library/react';
import { AccountSettings } from '@zextras/carbonio-shell-ui';

import {
	createSoapAPIInterceptor,
	FOLDERS,
	generateSettings,
	setupTest,
	useUserSettings
} from '@zextras/carbonio-ui-commons';
import { CONVACTIONS } from '../../../../../commons/utilities';
import { populateConversationInEmailStore } from '../../../../../tests/generators/generateConversation';
import { ConvActionRequest, ConvActionResponse } from '../../../../../types';
import { SearchConversationListItem } from '../search-conversation-list-item';

const conversationId = '-123';
describe('SearchConversationListItem', () => {
	it('should move the item to trash when clicking on Delete action when folder is INBOX', async () => {
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefGroupMailBy: 'conversation'
			}
		};
		const settings = generateSettings(customSettings);
		useUserSettings.mockReturnValue(settings);

		await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: conversationId, folderId: FOLDERS.INBOX }
			})
		);

		const interceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
			'ConvAction',
			{
				action: { id: conversationId, op: CONVACTIONS.TRASH }
			}
		);

		const { user } = setupTest(
			<SearchConversationListItem
				conversationId={conversationId}
				selecting={false}
				active={false}
				activeItemId={''}
				toggle={jest.fn()}
				selected={false}
				deselectAll={jest.fn()}
			/>
		);

		const messageActionWrapper = screen.getByTestId(`ConversationListItem-${conversationId}`);
		expect(messageActionWrapper).toBeVisible();

		act(() => {
			user.hover(messageActionWrapper);
		});
		const hoverBar = await screen.findByTestId(`primary-actions-bar-${conversationId}`);
		expect(hoverBar).toBeVisible();

		await user.click(screen.getByTestId('icon: Trash2Outline'));

		const request = await interceptor;

		expect(request.action).toStrictEqual({ id: conversationId, op: CONVACTIONS.TRASH });

		const confirmationSnackBar = await screen.findByText('E-mail moved to Trash');
		expect(confirmationSnackBar).toBeVisible();
	});

	it('should permanently delete the item when clicking on Delete permanently action when folder is TRASH', async () => {
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefGroupMailBy: 'conversation'
			}
		};
		const settings = generateSettings(customSettings);
		useUserSettings.mockReturnValue(settings);

		await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: conversationId, folderId: FOLDERS.TRASH },
				conversationMessagesNumber: 3
			})
		);

		const interceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
			'ConvAction',
			{
				action: { id: conversationId, op: CONVACTIONS.DELETE }
			}
		);

		const { user } = setupTest(
			<SearchConversationListItem
				conversationId={conversationId}
				selecting={false}
				active={false}
				activeItemId={''}
				toggle={jest.fn()}
				selected={false}
				deselectAll={jest.fn()}
			/>
		);

		const messageActionWrapper = screen.getByTestId(`ConversationListItem-${conversationId}`);
		expect(messageActionWrapper).toBeVisible();

		act(() => {
			user.hover(messageActionWrapper);
		});
		const hoverBar = await screen.findByTestId(`primary-actions-bar-${conversationId}`);
		expect(hoverBar).toBeVisible();

		await user.click(screen.getByTestId('icon: DeletePermanentlyOutline'));

		const deleteButton = await screen.findByText('Delete permanently');

		await user.click(deleteButton);

		const request = await interceptor;

		expect(request.action).toStrictEqual({ id: conversationId, op: CONVACTIONS.DELETE });
	});

	it('should permanently delete the item when clicking on Delete permanently action when folder is SPAM', async () => {
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefGroupMailBy: 'conversation'
			}
		};
		const settings = generateSettings(customSettings);
		useUserSettings.mockReturnValue(settings);

		await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: conversationId, folderId: FOLDERS.SPAM }
			})
		);

		const interceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
			'ConvAction',
			{
				action: { id: conversationId, op: CONVACTIONS.DELETE }
			}
		);

		const { user } = setupTest(
			<SearchConversationListItem
				conversationId={conversationId}
				selecting={false}
				active={false}
				activeItemId={''}
				toggle={jest.fn()}
				selected={false}
				deselectAll={jest.fn()}
			/>
		);

		const messageActionWrapper = screen.getByTestId(`ConversationListItem-${conversationId}`);
		expect(messageActionWrapper).toBeVisible();

		act(() => {
			user.hover(messageActionWrapper);
		});
		const hoverBar = await screen.findByTestId(`primary-actions-bar-${conversationId}`);
		expect(hoverBar).toBeVisible();

		await user.click(screen.getByTestId('icon: DeletePermanentlyOutline'));

		const deleteButton = await screen.findByText('Delete permanently');

		await user.click(deleteButton);

		const request = await interceptor;

		expect(request.action).toStrictEqual({ id: conversationId, op: CONVACTIONS.DELETE });
	});
});
