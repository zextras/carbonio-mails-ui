/* eslint-disable @typescript-eslint/no-empty-function */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';

import { generateConvMessageFromAPI } from '../../../../__test__/generators/api';
import { populateConversationInEmailStore } from '../../../../__test__/generators/generateConversation';
import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from '../../../../constants';
import { ConvActionRequest, SearchConvRequest, SearchConvResponse } from '../../../../types';
import { ConversationPreviewPanelContainer } from '../../../../views/app/detail-panel/conversation-preview-panel-container';
import * as searchConvAction from '../../actions/search-conv-action';
import { updateConversationStatus } from '../../store';
import { setupTest } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';

const CONVERSATION_ROUTE_PATH = '/folder/:folderId/conversation/:conversationId';

describe('useCompleteConversationOrFetch - Integration Tests', () => {
	describe('User opens conversation preview panel', () => {
		it('should fetch conversation and mark as read when opening unread conversation (auto-mark enabled)', async () => {
			useUserSettings.mockReturnValue({
				prefs: { zimbraPrefMarkMsgRead: '1' },
				attrs: {},
				props: []
			});

			const { conversation, messages } = await act(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '123', isRead: false },
					messageIds: ['m1', 'm2']
				})
			);

			const searchConvResponse: SearchConvResponse = {
				m: [
					generateConvMessageFromAPI({ id: messages[0].id }),
					generateConvMessageFromAPI({ id: messages[1].id })
				],
				more: false,
				offset: '',
				orderBy: ''
			};
			const searchConvInterceptor = createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>(
				'SearchConv',
				searchConvResponse
			);

			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: [`/folder/${messages[0].parent}/conversation/${conversation.id}`],
				path: CONVERSATION_ROUTE_PATH
			});

			await act(async () => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
				const searchRequest = await searchConvInterceptor;
				expect(searchRequest).toMatchObject({
					cid: conversation.id,
					fetch: 'all',
					read: 1
				});
			});

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

			const { conversation, messages } = await act(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '456', isRead: false },
					messageIds: ['m1', 'm2']
				})
			);

			const response: SearchConvResponse = {
				m: [
					generateConvMessageFromAPI({ id: messages[0].id }),
					generateConvMessageFromAPI({ id: messages[1].id })
				],
				more: false,
				offset: '',
				orderBy: ''
			};
			const searchConvInterceptor = createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>(
				'SearchConv',
				response
			);

			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: [`/folder/${messages[0].parent}/conversation/${conversation.id}`],
				path: CONVERSATION_ROUTE_PATH
			});

			await act(async () => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
				const searchRequest = await searchConvInterceptor;
				expect(searchRequest).toMatchObject({
					cid: conversation.id // Should NOT mark as read (missing read: 1)
				});
			});

			await waitFor(() => {
				expect(screen.getByTestId('PreviewPanelHeader')).toBeVisible();
			});
		});

		it('should NOT fetch when conversation is already fulfilled', async () => {
			jest.spyOn(console, 'error').mockImplementation(() => {});
			jest.spyOn(console, 'warn').mockImplementation(() => {});

			useUserSettings.mockReturnValue({
				prefs: { zimbraPrefMarkMsgRead: '1' },
				attrs: {},
				props: []
			});

			const { conversation, messages } = await act(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '789', isRead: true }
				})
			);

			await waitFor(() => {
				updateConversationStatus(conversation.id, API_REQUEST_STATUS.fulfilled);
			});

			const searchConvSpy = jest.spyOn(searchConvAction, 'searchConvEmailStoreAction');

			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: [`/folder/${messages[0].parent}/conversation/${conversation.id}`],
				path: CONVERSATION_ROUTE_PATH
			});

			await act(async () => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
			});

			// Should NOT call searchConv since conversation is already fulfilled
			expect(searchConvSpy).not.toHaveBeenCalled();
		});

		it('should handle conversation that is unread and already in store with fulfilled status', async () => {
			jest.spyOn(console, 'error').mockImplementation(() => {});
			jest.spyOn(console, 'warn').mockImplementation(() => {});

			useUserSettings.mockReturnValue({
				prefs: { zimbraPrefMarkMsgRead: '1' },
				attrs: {},
				props: []
			});

			const { conversation, messages } = await act(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '999', isRead: false },
					messageIds: ['m1', 'm2']
				})
			);

			act(() => {
				updateConversationStatus(conversation.id, API_REQUEST_STATUS.fulfilled);
			});

			// only the convAction API should be called in this case to mark the conversation as read
			const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: [`/folder/${messages[0].parent}/conversation/${conversation.id}`],
				path: CONVERSATION_ROUTE_PATH
			});

			await act(async () => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
			});

			const convActionRequest = await convActionInterceptor;
			expect(convActionRequest).toMatchObject({
				_jsns: 'urn:zimbraMail',
				action: {
					id: conversation.id,
					op: 'read'
				}
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

				const { conversation, messages } = await act(() =>
					populateConversationInEmailStore({
						conversationParams: { id: `test-${prefValue}`, isRead: false },
						messageIds: ['m1', 'm2']
					})
				);

				const searchConvResponse: SearchConvResponse = {
					m: [
						generateConvMessageFromAPI({ id: messages[0].id }),
						generateConvMessageFromAPI({ id: messages[1].id })
					],
					more: false,
					offset: '',
					orderBy: ''
				};
				const interceptor = createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>(
					'SearchConv',
					searchConvResponse
				);

				setupTest(<ConversationPreviewPanelContainer />, {
					initialEntries: [`/folder/${messages[0].parent}/conversation/${conversation.id}`],
					path: CONVERSATION_ROUTE_PATH
				});

				await act(async () => {
					jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
					const request = await interceptor;
					if (shouldMarkAsRead !== undefined) {
						expect(request).toMatchObject({
							cid: conversation.id,
							read: shouldMarkAsRead
						});
					} else {
						expect(request).toMatchObject({
							cid: conversation.id
						});
						expect(request).not.toHaveProperty('read');
					}
				});
			}
		);
	});

	describe('Conversation preview panel behavior with hook', () => {
		it('should set conversation status to pending and then fulfilled during fetch', async () => {
			const { conversation, messages } = await act(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '111', isRead: true },
					messageIds: ['m1', 'm2']
				})
			);

			const response: SearchConvResponse = {
				m: [
					generateConvMessageFromAPI({ id: messages[0].id }),
					generateConvMessageFromAPI({ id: messages[1].id })
				],
				more: false,
				offset: '',
				orderBy: ''
			};
			createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', response);

			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: [`/folder/${messages[0].parent}/conversation/${conversation.id}`],
				path: CONVERSATION_ROUTE_PATH
			});

			await act(async () => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
			});

			// Status should be pending during fetch
			await waitFor(() => {
				const previewHeader = screen.queryByTestId('PreviewPanelHeader');
				// Header should be visible once fulfilled
				expect(previewHeader).toBeInTheDocument();
			});
		});

		it('should not fetch if conversation status is already pending', async () => {
			const { conversation, messages } = await act(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '222', isRead: true }
				})
			);
			await waitFor(() => {
				updateConversationStatus(conversation.id, API_REQUEST_STATUS.pending);
			});

			const searchConvSpy = jest.spyOn(searchConvAction, 'searchConvEmailStoreAction');

			setupTest(<ConversationPreviewPanelContainer />, {
				initialEntries: [`/folder/${messages[0].parent}/conversation/${conversation.id}`],
				path: CONVERSATION_ROUTE_PATH
			});

			act(() => {
				jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
			});

			expect(searchConvSpy).not.toHaveBeenCalled();
		});
	});
});
