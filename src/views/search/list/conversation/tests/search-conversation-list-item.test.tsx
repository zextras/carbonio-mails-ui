/* eslint-disable testing-library/prefer-user-event */
// noinspection DuplicatedCode

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { AccountSettings } from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { CONVACTIONS } from 'commons/utilities';
import { ConvActionRequest, ConvActionResponse } from 'types/soap/conv-action';
import { SearchConversationListItem } from 'views/search/list/conversation/search-conversation-list-item';

const conversationId = '-123';

describe('SearchConversationListItem', () => {
	it('should move the Conversation to trash when clicking on Delete action when folder is INBOX', async () => {
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
				selected={false}
				index={0}
				onSelect={vi.fn()}
				onToggleExpanded={vi.fn()}
				isConversationExpanded={false}
			/>
		);

		const messageActionWrapper = screen.getByTestId(`ConversationListItem-${conversationId}`);
		expect(messageActionWrapper).toBeVisible();

		await user.hover(messageActionWrapper);
		await user.click(screen.getByTestId('icon: Trash2Outline'));

		const request = await interceptor;

		expect(request.action).toStrictEqual({ id: conversationId, op: CONVACTIONS.TRASH });

		const confirmationSnackBar = await screen.findByText('Conversation moved to Trash');
		expect(confirmationSnackBar).toBeVisible();
	});

	// FIXME: unhandled error
	it.skip('should permanently delete the item when clicking on Delete permanently action when folder is TRASH', async () => {
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
				selected={false}
				index={0}
				onSelect={vi.fn()}
				onToggleExpanded={vi.fn()}
				isConversationExpanded={false}
			/>
		);

		const messageActionWrapper = screen.getByTestId(`ConversationListItem-${conversationId}`);
		expect(messageActionWrapper).toBeVisible();

		act(() => {
			user.hover(messageActionWrapper);
		});
		await screen.findByTestId(`primary-actions-bar-${conversationId}`);

		await user.click(screen.getByTestId('icon: DeletePermanentlyOutline'));

		const deleteButton = await screen.findByText('Delete permanently');

		await user.click(deleteButton);

		const request = await interceptor;

		expect(request.action).toStrictEqual({ id: conversationId, op: CONVACTIONS.DELETE });
	});

	// FIXME: unhandled error
	it.skip('should permanently delete the item when clicking on Delete permanently action when folder is SPAM', async () => {
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
				selected={false}
				index={0}
				onSelect={vi.fn()}
				onToggleExpanded={vi.fn()}
				isConversationExpanded={false}
			/>
		);

		const messageActionWrapper = screen.getByTestId(`ConversationListItem-${conversationId}`);
		expect(messageActionWrapper).toBeVisible();

		act(() => {
			user.hover(messageActionWrapper);
		});
		await screen.findByTestId(`primary-actions-bar-${conversationId}`);

		await user.click(screen.getByTestId('icon: DeletePermanentlyOutline'));

		const deleteButton = await screen.findByText('Delete permanently');

		await user.click(deleteButton);

		const request = await interceptor;

		expect(request.action).toStrictEqual({ id: conversationId, op: CONVACTIONS.DELETE });
	});

	describe('expand/collapse functionality', () => {
		it('should show expand button when conversation has multiple messages', async () => {
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefGroupMailBy: 'conversation'
				}
			};
			const settings = generateSettings(customSettings);
			useUserSettings.mockReturnValue(settings);

			await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: conversationId, folderId: FOLDERS.INBOX },
					conversationMessagesNumber: 3
				})
			);

			setupTest(
				<SearchConversationListItem
					conversationId={conversationId}
					selecting={false}
					active={false}
					activeItemId={''}
					selected={false}
					index={0}
					onSelect={vi.fn()}
					onToggleExpanded={vi.fn()}
					isConversationExpanded={false}
				/>
			);

			const expandButton = await screen.findByTestId('ToggleExpand');
			expect(expandButton).toBeVisible();
		});

		it('should not show expand button when conversation has single message', async () => {
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefGroupMailBy: 'conversation'
				}
			};
			const settings = generateSettings(customSettings);
			useUserSettings.mockReturnValue(settings);

			await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: conversationId, folderId: FOLDERS.INBOX },
					conversationMessagesNumber: 1
				})
			);

			setupTest(
				<SearchConversationListItem
					conversationId={conversationId}
					selecting={false}
					active={false}
					activeItemId={''}
					selected={false}
					index={0}
					onSelect={vi.fn()}
					onToggleExpanded={vi.fn()}
					isConversationExpanded={false}
				/>
			);

			expect(screen.queryByTestId('ToggleExpand')).not.toBeInTheDocument();
		});

		it('should show collapsed state when isConversationExpanded is false', async () => {
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefGroupMailBy: 'conversation'
				}
			};
			const settings = generateSettings(customSettings);
			useUserSettings.mockReturnValue(settings);

			await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: conversationId, folderId: FOLDERS.INBOX },
					conversationMessagesNumber: 3
				})
			);

			setupTest(
				<SearchConversationListItem
					conversationId={conversationId}
					selecting={false}
					active={false}
					activeItemId={''}
					selected={false}
					index={0}
					onSelect={vi.fn()}
					onToggleExpanded={vi.fn()}
					isConversationExpanded={false}
				/>
			);

			const expandButton = await screen.findByTestId('ToggleExpand');
			expect(expandButton).toHaveAttribute('data-testid', 'ToggleExpand');

			// Should not show message list when collapsed
			expect(screen.queryByTestId('ConversationExpander')).not.toBeInTheDocument();
		});

		it('should show expanded state when isConversationExpanded is true', async () => {
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefGroupMailBy: 'conversation'
				}
			};
			const settings = generateSettings(customSettings);
			useUserSettings.mockReturnValue(settings);

			await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: conversationId, folderId: FOLDERS.INBOX },
					conversationMessagesNumber: 3
				})
			);

			createSoapAPIInterceptor('SearchConv');

			setupTest(
				<SearchConversationListItem
					conversationId={conversationId}
					selecting={false}
					active={false}
					activeItemId={''}
					selected={false}
					index={0}
					onSelect={vi.fn()}
					onToggleExpanded={vi.fn()}
					isConversationExpanded
				/>
			);

			// Should show message list when expanded
			const expanderElement = await screen.findByTestId('ConversationExpander');
			expect(expanderElement).toBeVisible();
		});

		it('should display correct arrow icon direction based on expand state', async () => {
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefGroupMailBy: 'conversation'
				}
			};
			const settings = generateSettings(customSettings);
			useUserSettings.mockReturnValue(settings);

			await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: conversationId, folderId: FOLDERS.INBOX },
					conversationMessagesNumber: 3
				})
			);

			const { rerender } = setupTest(
				<SearchConversationListItem
					conversationId={conversationId}
					selecting={false}
					active={false}
					activeItemId={''}
					selected={false}
					index={0}
					onSelect={vi.fn()}
					onToggleExpanded={vi.fn()}
					isConversationExpanded={false}
				/>
			);

			// When collapsed, should show down arrow
			let arrowIcon = screen.getByTestId('icon: ArrowIosDownward');
			expect(arrowIcon).toBeInTheDocument();

			// Rerender with expanded state
			rerender(
				<SearchConversationListItem
					conversationId={conversationId}
					selecting={false}
					active={false}
					activeItemId={''}
					selected={false}
					index={0}
					onSelect={vi.fn()}
					onToggleExpanded={vi.fn()}
					isConversationExpanded
				/>
			);

			// When expanded, should show up arrow
			arrowIcon = screen.getByTestId('icon: ArrowIosUpward');
			expect(arrowIcon).toBeInTheDocument();
		});

		// FIXME: unhandled error
		it.skip('should trigger fetch when manually expanding a conversation', async () => {
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefGroupMailBy: 'conversation'
				}
			};
			const settings = generateSettings(customSettings);
			useUserSettings.mockReturnValue(settings);

			await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: conversationId, folderId: FOLDERS.INBOX },
					conversationMessagesNumber: 3
				})
			);

			const interceptor = createSoapAPIInterceptor('SearchConv');
			const onToggleExpanded = vi.fn();

			setupTest(
				<SearchConversationListItem
					conversationId={conversationId}
					selecting={false}
					active={false}
					activeItemId={''}
					selected={false}
					index={0}
					onSelect={vi.fn()}
					onToggleExpanded={onToggleExpanded}
					isConversationExpanded={false}
				/>
			);

			const expandButton = await screen.findByTestId('ToggleExpand');

			fireEvent.click(expandButton);

			await waitFor(() => {
				expect(onToggleExpanded).toHaveBeenCalledWith(conversationId);
			});

			// Should trigger the SearchConv API call
			await interceptor;
		});

		it('should not trigger fetch when conversation data is already loaded', async () => {
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefGroupMailBy: 'conversation'
				}
			};
			const settings = generateSettings(customSettings);
			useUserSettings.mockReturnValue(settings);

			await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: conversationId, folderId: FOLDERS.INBOX },
					conversationMessagesNumber: 3
				})
			);

			// Mark conversation as already loaded
			const { updateConversationStatus } = await import('store/emails/store');
			const { API_REQUEST_STATUS } = await import('constants/index');
			updateConversationStatus(conversationId, API_REQUEST_STATUS.fulfilled);

			const onToggleExpanded = vi.fn();

			setupTest(
				<SearchConversationListItem
					conversationId={conversationId}
					selecting={false}
					active={false}
					activeItemId={''}
					selected={false}
					index={0}
					onSelect={vi.fn()}
					onToggleExpanded={onToggleExpanded}
					isConversationExpanded={false}
				/>
			);

			const expandButton = await screen.findByTestId('ToggleExpand');

			fireEvent.click(expandButton);

			await waitFor(() => {
				expect(onToggleExpanded).toHaveBeenCalledWith(conversationId);
			});

			// No SearchConv API call should be triggered since data is already loaded
		});

		it('should not trigger fetch when toggling from expanded to collapsed', async () => {
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefGroupMailBy: 'conversation'
				}
			};
			const settings = generateSettings(customSettings);
			useUserSettings.mockReturnValue(settings);

			await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: conversationId, folderId: FOLDERS.INBOX },
					conversationMessagesNumber: 3
				})
			);

			const onToggleExpanded = vi.fn();

			setupTest(
				<SearchConversationListItem
					conversationId={conversationId}
					selecting={false}
					active={false}
					activeItemId={''}
					selected={false}
					index={0}
					onSelect={vi.fn()}
					onToggleExpanded={onToggleExpanded}
					isConversationExpanded
				/>
			);

			const expandButton = await screen.findByTestId('ToggleExpand');

			fireEvent.click(expandButton);

			await waitFor(() => {
				expect(onToggleExpanded).toHaveBeenCalledWith(conversationId);
			});

			// No API call should be triggered when collapsing
		});
	});
});
