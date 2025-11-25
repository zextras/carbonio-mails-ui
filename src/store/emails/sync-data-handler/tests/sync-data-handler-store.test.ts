/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook, waitFor } from '@testing-library/react';
import { getUserSettings } from '@zextras/carbonio-shell-ui';
import type { Mock } from 'vitest';

import {
	generateConversation,
	populateConversationInEmailStore
} from '__test__/generators/generateConversation';
import { generateMessage } from '__test__/generators/generateMessage';
import { useCompleteConversationOrFetch } from 'store/emails/hooks/hooks';
import {
	handleNotifyMessagesCreated,
	setConversationsInEmailStore,
	setMessagesInEmailStore,
	useConversationById,
	useMessageById,
	useMessageIndexSlice
} from 'store/emails/store';
import { triggerNotification } from 'store/emails/sync-data-handler/trigger-notification';

vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	getTags: vi.fn()
}));
describe('handleNotifyMessagesCreated', () => {
	describe('addMessagesToMessageSlice', () => {
		it('should add messages to populatedItemsSlice.messages', async () => {
			const message = generateMessage({ id: '1' });
			setMessagesInEmailStore([message], false);
			const newMessage = generateMessage({ id: '2' });
			handleNotifyMessagesCreated([newMessage]);
			const { result } = renderHook(() => useMessageById(newMessage.id));
			await waitFor(async () => {
				expect(result.current).toEqual(newMessage);
			});
		});

		it('should update messageListIndex with new message ids', async () => {
			const message = generateMessage({ id: '1' });
			setMessagesInEmailStore([message], false);
			const newMessage = generateMessage({ id: '2' });
			handleNotifyMessagesCreated([newMessage]);
			const { result } = renderHook(() => useMessageIndexSlice());
			await waitFor(async () => {
				expect(result.current?.messageListIndex).toEqual(['2', '1']);
			});
		});
	});

	describe('getOrderedMessagesForConversation', () => {
		it('should not duplicate messages', async () => {
			await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '123' },
					messageIds: ['2']
				})
			);

			const newMessage = { ...generateMessage({ id: '2' }), conversation: '123' };
			handleNotifyMessagesCreated([newMessage]);
			const { result } = renderHook(() =>
				useCompleteConversationOrFetch({ conversationId: '123' })
			);
			await waitFor(async () => {
				expect(result.current.conversation.messageIds).toEqual(['2']);
			});
		});

		it('should return messages in descending order when sortOrder is dateDesc', async () => {
			(getUserSettings as Mock).mockReturnValue({
				prefs: { zimbraPrefConversationOrder: 'dateDesc' }
			});
			const message = generateMessage({ id: '1' });
			setConversationsInEmailStore(
				[generateConversation({ id: '123', messageIds: [message.id] })],
				false
			);
			const newMessage = { ...generateMessage({ id: '2' }), conversation: '123' };
			handleNotifyMessagesCreated([newMessage]);
			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(async () => {
				expect(result.current.messageIds).toEqual(['2', '1']);
			});
		});

		it('should return messages in ascending order when sortOrder is not dateDesc', async () => {
			(getUserSettings as Mock).mockReturnValue({
				prefs: { zimbraPrefConversationOrder: 'dateAsc' }
			});

			const message = generateMessage({ id: '1' });
			setConversationsInEmailStore(
				[generateConversation({ id: '123', messageIds: [message.id] })],
				false
			);
			const newMessage = { ...generateMessage({ id: '2' }), conversation: '123' };
			handleNotifyMessagesCreated([newMessage]);
			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(async () => {
				const messagesIds = result.current.messageIds;
				expect(messagesIds).toEqual(['1', '2']);
			});
		});
	});
});

let mockIsFocusMode = false;

const mockedMultipleNotify = vi.fn();

vi.mock('@zextras/carbonio-shell-ui', () => ({
	get IS_FOCUS_MODE(): boolean {
		return mockIsFocusMode;
	},
	getNotificationManager: vi.fn(() => ({
		multipleNotify: mockedMultipleNotify
	})),
	getUserSettings: vi.fn(() => ({
		props: [],
		prefs: {
			zimbraPrefMailToasterEnabled: 'TRUE',
			zimbraPrefShowAllNewMailNotifications: 'TRUE'
		}
	}))
}));

describe('triggerNotification', () => {
	it('multipleNotify is not called if IS_FOCUS_MODE is true', () => {
		mockIsFocusMode = true;
		triggerNotification([generateMessage({ id: 'id-1' })], vi.fn());
		expect(mockedMultipleNotify).not.toHaveBeenCalled();
	});

	it('multipleNotify is called if IS_FOCUS_MODE is false', () => {
		mockIsFocusMode = false;
		triggerNotification([generateMessage({ id: 'id-1' })], vi.fn());
		expect(mockedMultipleNotify).toHaveBeenCalled();
	});
});
