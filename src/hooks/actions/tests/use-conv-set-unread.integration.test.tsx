/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateConversation } from '__test__/generators/generateConversation';
import { API_REQUEST_STATUS } from 'constants/index';
import { useConvSetUnreadFn } from 'hooks/actions/use-conv-set-unread';
import {
	updateConversationStatus,
	updateConversations,
	useConversationById
} from 'store/emails/store';
import { ConvActionRequest, ConvActionResponse } from 'types';

const MARK_UNREAD_BTN_TESTID = 'mark-unread-btn';

// Helper to populate conversation in store
async function populateConversationInStore(params: {
	conversationParams: { id: string; isRead: boolean; folderId?: string };
}): Promise<{ conversation: ReturnType<typeof generateConversation> }> {
	const { conversationParams } = params;
	const conversation = generateConversation({
		id: conversationParams.id,
		isRead: conversationParams.isRead,
		folderId: conversationParams.folderId || FOLDERS.INBOX
	});

	await act(async () => {
		updateConversations([conversation]);
	});

	return { conversation };
}

describe('useConvSetUnread - Integration Tests', () => {
	describe('Mark conversation as unread action', () => {
		it('should mark read conversation as unread when action is executed', async () => {
			const { conversation } = await populateConversationInStore({
				conversationParams: { id: 'conv1', isRead: true }
			});

			await act(async () => {
				updateConversationStatus(conversation.id, API_REQUEST_STATUS.fulfilled);
			});

			const convActionResponse: ConvActionResponse = {
				action: {
					id: conversation.id,
					op: '!read'
				}
			};

			const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
				'ConvAction',
				convActionResponse
			);

			// Test component that uses the hook
			const TestComponent = (): React.JSX.Element => {
				const { execute, canExecute } = useConvSetUnreadFn({
					ids: [conversation.id],
					folderId: FOLDERS.INBOX,
					isConversationRead: true, // Explicitly set to true
					shouldReplaceHistory: true
				});

				return (
					<div>
						<button data-testid={MARK_UNREAD_BTN_TESTID} onClick={execute} disabled={!canExecute()}>
							Mark as Unread
						</button>
					</div>
				);
			};

			const { user } = setupTest(<TestComponent />, {
				initialEntries: [`/folder/${FOLDERS.INBOX}/conversation/${conversation.id}`]
			});

			const markUnreadBtn = screen.getByTestId(MARK_UNREAD_BTN_TESTID);
			expect(markUnreadBtn).toBeEnabled();

			await user.click(markUnreadBtn);

			// Verify API was called with correct parameters
			const convActionRequest = await convActionInterceptor;
			expect(convActionRequest).toMatchObject({
				action: {
					id: conversation.id,
					op: '!read'
				}
			});
		});

		it('should mark conversation as unread with shouldReplaceHistory false', async () => {
			const { conversation } = await populateConversationInStore({
				conversationParams: { id: 'conv2', isRead: true }
			});

			const convActionResponse: ConvActionResponse = {
				action: {
					id: conversation.id,
					op: '!read'
				}
			};

			const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
				'ConvAction',
				convActionResponse
			);

			// Test component that uses the hook
			const TestComponent = (): React.JSX.Element => {
				const { execute } = useConvSetUnreadFn({
					ids: [conversation.id],
					folderId: FOLDERS.INBOX,
					isConversationRead: true, // Explicitly set to true
					shouldReplaceHistory: false
				});

				return (
					<div>
						<button data-testid={MARK_UNREAD_BTN_TESTID} onClick={execute}>
							Mark as Unread
						</button>
					</div>
				);
			};

			const { user } = setupTest(<TestComponent />, {
				initialEntries: [`/folder/${FOLDERS.INBOX}/conversation/${conversation.id}`]
			});

			const markUnreadBtn = screen.getByTestId(MARK_UNREAD_BTN_TESTID);
			await user.click(markUnreadBtn);

			// Verify API was called
			const convActionRequest = await convActionInterceptor;
			expect(convActionRequest).toMatchObject({
				action: {
					id: conversation.id,
					op: '!read'
				}
			});
		});

		it('should NOT execute when conversation is already unread', async () => {
			const { conversation } = await populateConversationInStore({
				conversationParams: { id: 'conv3', isRead: false }
			});

			const convActionSpy = jest.fn();
			createSoapAPIInterceptor('ConvAction').then(convActionSpy);

			// Test component that uses the hook
			const TestComponent = (): React.JSX.Element => {
				const conv = useConversationById(conversation.id);
				const { execute, canExecute } = useConvSetUnreadFn({
					ids: [conversation.id],
					folderId: FOLDERS.INBOX,
					isConversationRead: conv?.read ?? false,
					shouldReplaceHistory: false
				});

				return (
					<div>
						<button data-testid={MARK_UNREAD_BTN_TESTID} onClick={execute} disabled={!canExecute()}>
							Mark as Unread
						</button>
					</div>
				);
			};

			const { user } = setupTest(<TestComponent />);

			const markUnreadBtn = screen.getByTestId(MARK_UNREAD_BTN_TESTID);
			expect(markUnreadBtn).toBeDisabled();

			await user.click(markUnreadBtn);

			// API should NOT be called
			await waitFor(
				() => {
					expect(convActionSpy).not.toHaveBeenCalled();
				},
				{ timeout: 500 }
			);
		});

		it('should NOT execute when conversation is in Drafts folder', async () => {
			const { conversation } = await populateConversationInStore({
				conversationParams: { id: 'conv4', isRead: true, folderId: FOLDERS.DRAFTS }
			});

			const convActionSpy = jest.fn();
			createSoapAPIInterceptor('ConvAction').then(convActionSpy);

			// Test component that uses the hook
			const TestComponent = (): React.JSX.Element => {
				const conv = useConversationById(conversation.id);
				const { execute, canExecute } = useConvSetUnreadFn({
					ids: [conversation.id],
					folderId: FOLDERS.DRAFTS,
					isConversationRead: conv?.read ?? true,
					shouldReplaceHistory: false
				});

				return (
					<div>
						<button data-testid="mark-unread-btn" onClick={execute} disabled={!canExecute()}>
							Mark as Unread
						</button>
					</div>
				);
			};

			setupTest(<TestComponent />);

			const markUnreadBtn = screen.getByTestId(MARK_UNREAD_BTN_TESTID);
			expect(markUnreadBtn).toBeDisabled();
		});

		it('should execute successfully for conversation in Sent folder', async () => {
			const { conversation } = await populateConversationInStore({
				conversationParams: { id: 'conv5', isRead: true, folderId: FOLDERS.SENT }
			});

			const convActionResponse: ConvActionResponse = {
				action: {
					id: conversation.id,
					op: '!read'
				}
			};

			const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
				'ConvAction',
				convActionResponse
			);

			// Test component that uses the hook
			const TestComponent = (): React.JSX.Element => {
				const conv = useConversationById(conversation.id);
				const { execute } = useConvSetUnreadFn({
					ids: [conversation.id],
					folderId: FOLDERS.SENT,
					isConversationRead: conv?.read ?? true,
					shouldReplaceHistory: false
				});

				return (
					<div>
						<button data-testid="mark-unread-btn" onClick={execute}>
							Mark as Unread
						</button>
					</div>
				);
			};

			const { user } = setupTest(<TestComponent />);

			const markUnreadBtn = screen.getByTestId('mark-unread-btn');
			await user.click(markUnreadBtn);

			const convActionRequest = await convActionInterceptor;
			expect(convActionRequest).toMatchObject({
				action: {
					id: conversation.id,
					op: '!read'
				}
			});
		});
	});

	describe('Bulk mark conversations as unread', () => {
		it('should mark multiple conversations as unread', async () => {
			const conv1 = generateConversation({ id: 'conv-bulk-1', isRead: true });
			const conv2 = generateConversation({ id: 'conv-bulk-2', isRead: true });
			const conv3 = generateConversation({ id: 'conv-bulk-3', isRead: true });

			await act(async () => {
				updateConversations([conv1, conv2, conv3]);
			});

			const convActionResponse: ConvActionResponse = {
				action: {
					id: 'conv-bulk-1,conv-bulk-2,conv-bulk-3',
					op: '!read'
				}
			};

			const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
				'ConvAction',
				convActionResponse
			);

			const TestComponent = (): React.JSX.Element => {
				const { execute } = useConvSetUnreadFn({
					ids: ['conv-bulk-1', 'conv-bulk-2', 'conv-bulk-3'],
					folderId: FOLDERS.INBOX,
					isConversationRead: true,
					shouldReplaceHistory: false
				});

				return (
					<div>
						<button data-testid="mark-unread-bulk-btn" onClick={execute}>
							Mark Selected as Unread
						</button>
					</div>
				);
			};

			const { user } = setupTest(<TestComponent />);

			const markUnreadBtn = screen.getByTestId('mark-unread-bulk-btn');
			await user.click(markUnreadBtn);

			const convActionRequest = await convActionInterceptor;
			expect(convActionRequest).toMatchObject({
				action: {
					id: 'conv-bulk-1,conv-bulk-2,conv-bulk-3',
					op: '!read'
				}
			});
		});
	});
});
