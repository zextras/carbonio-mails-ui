/* eslint-disable testing-library/no-wait-for-side-effects,testing-library/prefer-user-event */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { AccountSettings } from '@zextras/carbonio-shell-ui';

import { SearchMessageListItem } from '../search-message-list-item';
import { setupTest } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { CONVACTIONS } from 'commons/utilities';
import { MsgActionRequest, MsgActionResponse } from 'types/index.d';

describe('SearchMessageListItem', () => {
	it('should delete the item when clicking on Delete action when in message mode', async () => {
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefGroupMailBy: 'message'
			}
		};
		const settings = generateSettings(customSettings);
		useUserSettings.mockReturnValue(settings);

		const messages = await waitFor(() => populateMessagesInEmailStore({}));
		const interceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>('MsgAction', {
			action: { op: CONVACTIONS.TRASH, id: '100' }
		});

		const { user } = setupTest(
			<SearchMessageListItem
				completeMessage={messages[0]}
				selecting={false}
				active={false}
				index={0}
				onSelect={vi.fn()}
				selected={false}
			/>
		);

		const messageActionWrapper = screen.getByTestId(`MessageListItem-100`);
		expect(messageActionWrapper).toBeVisible();

		act(() => {
			user.hover(messageActionWrapper);
		});
		await screen.findByTestId(`primary-actions-bar-100`);

		act(() => {
			user.click(screen.getByTestId('icon: Trash2Outline'));
		});
		const request = await interceptor;
		expect(request.action).toStrictEqual({ id: '100', op: CONVACTIONS.TRASH });
	});

	describe('mark-as-read behavior', () => {
		it('should mark message as read on single click when unread, complete and preference enabled', async () => {
			const settings = generateSettings({
				prefs: {
					zimbraPrefGroupMailBy: 'message',
					zimbraPrefMarkMsgRead: '0' // mark as read on single click
				}
			});
			useUserSettings.mockReturnValue(settings);

			const generatedMessages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{ id: '201', isRead: false, isComplete: true } // unread & complete
				]
			});

			const interceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				{
					action: { op: 'read', id: '201' }
				}
			);

			setupTest(
				<SearchMessageListItem
					completeMessage={generatedMessages[0]}
					selecting={false}
					active={false}
					index={0}
					onSelect={vi.fn()}
					selected={false}
				/>
			);

			const wrapper = await screen.findByTestId('MessageListItemWithoutActions-201');

			await waitFor(() => {
				fireEvent.click(wrapper);
			});
			const request = await interceptor;
			expect(request.action).toStrictEqual({ id: '201', op: 'read' });
		});

		it('should NOT mark as read when message isComplete property is undefined', async () => {
			useUserSettings.mockReturnValue(
				generateSettings({
					prefs: { zimbraPrefGroupMailBy: 'message', zimbraPrefMarkMsgRead: '0' }
				})
			);
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '205', isRead: false, isComplete: undefined }]
			});

			setupTest(
				<SearchMessageListItem
					completeMessage={messages[0]}
					selecting={false}
					active={false}
					index={0}
					onSelect={vi.fn()}
					selected={false}
				/>
			);
			const wrapper = await screen.findByTestId('MessageListItemWithoutActions-205');
			await waitFor(() => {
				fireEvent.click(wrapper);
			});

			// No assertion needed as we are just ensuring no errors occur, if any calls were made, the test would fail
		});

		it('should NOT mark as read when message is not complete', async () => {
			useUserSettings.mockReturnValue(
				generateSettings({
					prefs: { zimbraPrefGroupMailBy: 'message', zimbraPrefMarkMsgRead: '0' }
				})
			);
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '205', isRead: false, isComplete: false }]
			});

			setupTest(
				<SearchMessageListItem
					completeMessage={messages[0]}
					selecting={false}
					active={false}
					index={0}
					onSelect={vi.fn()}
					selected={false}
				/>
			);
			const wrapper = await screen.findByTestId('MessageListItemWithoutActions-205');
			await waitFor(() => {
				fireEvent.click(wrapper);
			});

			// No assertion needed as we are just ensuring no errors occur, if any calls were made, the test would fail
		});

		it('should NOT mark as read when message already read', async () => {
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefGroupMailBy: 'message',
					zimbraPrefMarkMsgRead: '0'
				}
			};
			useUserSettings.mockReturnValue(generateSettings(customSettings));

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '202', isRead: true, isComplete: true }]
			});

			setupTest(
				<SearchMessageListItem
					completeMessage={messages[0]}
					selecting={false}
					active={false}
					index={0}
					onSelect={vi.fn()}
					selected={false}
				/>
			);

			const wrapper = await screen.findByTestId('MessageListItemWithoutActions-202');
			await waitFor(() => {
				fireEvent.click(wrapper);
			});

			// No assertion needed as we are just ensuring no errors occur, if any calls were made, the test would fail
		});

		it('should NOT mark as read when user preference disabled', async () => {
			useUserSettings.mockReturnValue(
				generateSettings({
					prefs: { zimbraPrefGroupMailBy: 'message', zimbraPrefMarkMsgRead: '-1' }
				})
			);
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '204', isRead: false, isComplete: true }]
			});

			setupTest(
				<SearchMessageListItem
					completeMessage={messages[0]}
					selecting={false}
					active={false}
					index={0}
					onSelect={vi.fn()}
					selected={false}
				/>
			);

			const wrapper = await screen.findByTestId('MessageListItemWithoutActions-204');
			await waitFor(() => {
				fireEvent.click(wrapper);
			});

			// No assertion needed as we are just ensuring no errors occur, if any calls were made, the test would fail
		});
	});
});
