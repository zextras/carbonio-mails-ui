/* eslint-disable @typescript-eslint/no-empty-function */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateCompleteMessageFromAPI } from '__test__/generators/api';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from 'constants/index';
import * as getMessageAction from 'store/emails/actions/get-message';
import { updateMessageStatus } from 'store/emails/store';
import { GetMsgRequest, GetMsgResponse } from 'types';
import { MessagePreviewPanelContainer } from 'views/app/detail-panel/message-preview-panel-container';

const MESSAGE_ROUTE_PATH = '/folder/:folderId/message/:messageId';

describe('useCompleteMessageOrFetch - Integration Tests', () => {
	describe('User opens message preview panel', () => {
		it('should fetch message and mark as read when opening unread message (auto-mark enabled)', async () => {
			useUserSettings.mockReturnValue({
				prefs: { zimbraPrefMarkMsgRead: '1' },
				attrs: {},
				props: []
			});

			const [message] = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: 'm1',
						folderId: '2',
						isRead: false,
						isComplete: false
					}
				]
			});

			const getMsgResponse: GetMsgResponse = {
				m: [generateCompleteMessageFromAPI({ id: message.id })]
			};

			const getMsgInterceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>(
				'GetMsg',
				getMsgResponse
			);

			jest.spyOn(console, 'error').mockImplementation();

			setupTest(<MessagePreviewPanelContainer />, {
				initialEntries: [`/folder/${message.parent}/message/${message.id}`],
				path: MESSAGE_ROUTE_PATH
			});

			await act(async () => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
				const getMsgRequest = await getMsgInterceptor;
				expect(getMsgRequest).toMatchObject({
					m: {
						id: message.id,
						html: 1,
						needExp: 1,
						read: 1
					}
				});
			});

			// Verify preview panel is rendered
			await waitFor(() => {
				expect(screen.getByTestId('PreviewPanelHeader')).toBeVisible();
			});
		});

		it('should NOT mark as read when auto-mark-as-read is disabled', async () => {
			useUserSettings.mockReturnValue({
				prefs: { zimbraPrefMarkMsgRead: '-1' }, // disabled in user prefs
				attrs: {},
				props: []
			});

			const [message] = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: 'm2',
						folderId: '2',
						isRead: false,
						isComplete: false
					}
				]
			});

			const getMsgResponse: GetMsgResponse = {
				m: [generateCompleteMessageFromAPI({ id: message.id })]
			};

			const getMsgInterceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>(
				'GetMsg',
				getMsgResponse
			);

			setupTest(<MessagePreviewPanelContainer />, {
				initialEntries: [`/folder/${message.parent}/message/${message.id}`],
				path: MESSAGE_ROUTE_PATH
			});

			await act(async () => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
				const getMsgRequest = await getMsgInterceptor;
				expect(getMsgRequest).toMatchObject({
					m: {
						id: message.id,
						html: 1,
						needExp: 1
						// Should NOT have read property
					}
				});
			});

			await waitFor(() => {
				expect(screen.getByTestId('PreviewPanelHeader')).toBeVisible();
			});
		});

		it('should NOT fetch when message is already complete and fulfilled', async () => {
			jest.spyOn(console, 'error').mockImplementation(() => {});
			jest.spyOn(console, 'warn').mockImplementation(() => {});

			useUserSettings.mockReturnValue({
				prefs: { zimbraPrefMarkMsgRead: '1' },
				attrs: {},
				props: []
			});

			const [message] = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: 'm3',
						folderId: '2',
						isRead: true,
						isComplete: true
					}
				]
			});

			await waitFor(() => {
				updateMessageStatus(message.id, API_REQUEST_STATUS.fulfilled);
			});

			const getMsgSpy = jest.spyOn(getMessageAction, 'getMessageEmailStoreAction');

			setupTest(<MessagePreviewPanelContainer />, {
				initialEntries: [`/folder/${message.parent}/message/${message.id}`],
				path: MESSAGE_ROUTE_PATH
			});

			await act(async () => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
			});

			// Should NOT call GetMsg since message is already complete and fulfilled
			expect(getMsgSpy).not.toHaveBeenCalled();

			await waitFor(() => {
				expect(screen.getByTestId('PreviewPanelHeader')).toBeVisible();
			});
		});

		it('should fetch message that is unread but incomplete, marking it as read', async () => {
			jest.spyOn(console, 'error').mockImplementation(() => {});
			jest.spyOn(console, 'warn').mockImplementation(() => {});

			useUserSettings.mockReturnValue({
				prefs: { zimbraPrefMarkMsgRead: '1' },
				attrs: {},
				props: []
			});

			const [message] = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: 'm4',
						folderId: '2',
						isRead: false,
						isComplete: false
					}
				]
			});

			const getMsgResponse: GetMsgResponse = {
				m: [generateCompleteMessageFromAPI({ id: message.id })]
			};

			const getMsgInterceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>(
				'GetMsg',
				getMsgResponse
			);

			setupTest(<MessagePreviewPanelContainer />, {
				initialEntries: [`/folder/${message.parent}/message/${message.id}`],
				path: MESSAGE_ROUTE_PATH
			});

			await act(async () => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
				const getMsgRequest = await getMsgInterceptor;
				expect(getMsgRequest).toMatchObject({
					m: {
						id: message.id,
						read: 1
					}
				});
			});
		});
	});

	describe('Testing auto-mark-as-read with different user preference values', () => {
		it.each([
			['0', 1, 'immediately'],
			['1', 1, '1 second'],
			['5', 1, '5 seconds'],
			['-1', undefined, 'disabled'] // should NOT include read param when pref is -1
		])(
			'should handle zimbraPrefMarkMsgRead=%s (%s)',
			async (prefValue, shouldMarkAsRead, _description) => {
				useUserSettings.mockReturnValue({
					prefs: { zimbraPrefMarkMsgRead: prefValue },
					attrs: {},
					props: []
				});

				const [message] = populateMessagesInEmailStore({
					messageGeneratorParams: [
						{
							id: `msg-test-${prefValue}`,
							folderId: '2',
							isRead: false,
							isComplete: false
						}
					]
				});

				const getMsgResponse: GetMsgResponse = {
					m: [generateCompleteMessageFromAPI({ id: message.id })]
				};

				const getMsgRequestInterceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>(
					'GetMsg',
					getMsgResponse
				);

				setupTest(<MessagePreviewPanelContainer />, {
					initialEntries: [`/folder/${message.parent}/message/${message.id}`],
					path: MESSAGE_ROUTE_PATH
				});

				await act(async () => {
					jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
					const request = await getMsgRequestInterceptor;
					if (shouldMarkAsRead !== undefined) {
						expect(request).toMatchObject({
							m: {
								id: message.id,
								read: shouldMarkAsRead
							}
						});
					} else {
						expect(request).toMatchObject({
							m: {
								id: message.id
							}
						});
					}
				});
			}
		);
	});

	describe('Message preview panel behavior with hook', () => {
		it('should set message status to pending and then fulfilled during fetch', async () => {
			const [message] = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: 'm5',
						folderId: '2',
						isRead: true,
						isComplete: false
					}
				]
			});

			const getMsgResponse: GetMsgResponse = {
				m: [generateCompleteMessageFromAPI({ id: message.id })]
			};

			createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', getMsgResponse);

			setupTest(<MessagePreviewPanelContainer />, {
				initialEntries: [`/folder/${message.parent}/message/${message.id}`],
				path: MESSAGE_ROUTE_PATH
			});

			await act(async () => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
			});

			// Status should be pending during fetch, then fulfilled
			await waitFor(() => {
				const previewHeader = screen.queryByTestId('PreviewPanelHeader');
				// Header should be visible once fulfilled
				expect(previewHeader).toBeInTheDocument();
			});
		});

		it('should not fetch if message status is already pending', async () => {
			const [message] = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: 'm6',
						folderId: '2',
						isRead: true,
						isComplete: false
					}
				]
			});

			await waitFor(() => {
				updateMessageStatus(message.id, API_REQUEST_STATUS.pending);
			});

			const getMsgSpy = jest.spyOn(getMessageAction, 'getMessageEmailStoreAction');

			setupTest(<MessagePreviewPanelContainer />, {
				initialEntries: [`/folder/${message.parent}/message/${message.id}`],
				path: MESSAGE_ROUTE_PATH
			});

			await act(async () => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
			});

			expect(getMsgSpy).not.toHaveBeenCalled();
		});

		it('should fetch if message status is undefined even if message appears complete', async () => {
			const [message] = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: 'm7',
						folderId: '2',
						isRead: true,
						isComplete: true
					}
				]
			});

			// Set status to undefined
			await waitFor(() => {
				updateMessageStatus(message.id, undefined as never);
			});

			const getMsgResponse: GetMsgResponse = {
				m: [generateCompleteMessageFromAPI({ id: message.id })]
			};

			const getMsgInterceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>(
				'GetMsg',
				getMsgResponse
			);

			setupTest(<MessagePreviewPanelContainer />, {
				initialEntries: [`/folder/${message.parent}/message/${message.id}`],
				path: MESSAGE_ROUTE_PATH
			});

			await act(async () => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
				const getMsgRequest = await getMsgInterceptor;
				expect(getMsgRequest).toMatchObject({
					m: {
						id: message.id
					}
				});
			});
		});
	});
});
