/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import {
	removeMessages,
	updateConversationMessages,
	updateConversations,
	updateConversationStatus,
	updateMessages,
	updateMessagesFlaggedStatus,
	updateMessagesParent,
	updateMessagesReadStatus,
	useConversationById,
	useConversationStatus,
	useMessageById
} from './store';
import { API_REQUEST_STATUS } from '../../../constants';
import { generateConversation } from '../../../tests/generators/generateConversation';
import { generateMessage } from '../../../tests/generators/generateMessage';

describe('message store', () => {
	describe('conversation', () => {
		it('should set and return a conversation', () => {
			const conversation = generateConversation({ id: '1' });
			updateConversations([conversation], 0);

			const { result } = renderHook(() => useConversationById('1'));

			expect(result.current).toEqual(conversation);
		});

		it('should get undefined if conversation loading status not present', () => {
			const { result } = renderHook(() => useConversationStatus('123'));

			expect(result.current).toBeUndefined();
		});

		it('should set and get conversation status if value present', () => {
			updateConversationStatus('123', API_REQUEST_STATUS.fulfilled);

			const { result } = renderHook(() => useConversationStatus('123'));

			expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
		});

		it('should update conversation messages', () => {
			const conversation = generateConversation({ id: '1' });
			updateConversations([conversation], 0);

			const message = generateMessage({ id: '1' });
			updateConversationMessages(conversation.id, [message]);

			const { result } = renderHook(() => useConversationById('1'));

			expect(result.current.messages).toHaveLength(1);
			expect(result.current.messages[0]).toBe(message);
		});
	});

	describe('messages', () => {
		it('should set and return a message', () => {
			const message = generateMessage({ id: '1' });
			updateMessages([message], 0);

			const { result } = renderHook(() => useMessageById('1'));

			expect(result.current).toEqual(message);
		});

		it('should update and return messages parent', () => {
			updateMessages([generateMessage({ id: '1' }), generateMessage({ id: '2' })], 0);

			const newFolder = 'newFolder';
			updateMessagesParent(newFolder, ['1', '2']);

			expect(renderHook(() => useMessageById('1')).result.current.parent).toBe(newFolder);
			expect(renderHook(() => useMessageById('2')).result.current.parent).toBe(newFolder);
		});

		it('should flag all messages', () => {
			updateMessages(
				[
					generateMessage({ id: '1', isFlagged: false }),
					generateMessage({ id: '2', isFlagged: false })
				],
				0
			);

			updateMessagesFlaggedStatus(['1', '2'], true);

			expect(renderHook(() => useMessageById('1')).result.current.flagged).toBe(true);
			expect(renderHook(() => useMessageById('2')).result.current.flagged).toBe(true);
		});

		it('should mark as read all messages', () => {
			updateMessages(
				[generateMessage({ id: '1', isRead: false }), generateMessage({ id: '2', isRead: false })],
				0
			);

			updateMessagesReadStatus(['1', '2'], true);

			expect(renderHook(() => useMessageById('1')).result.current.read).toBe(true);
			expect(renderHook(() => useMessageById('2')).result.current.read).toBe(true);
		});

		it('should delete all messages', () => {
			act(() => {
				updateMessages([generateMessage({ id: '1' }), generateMessage({ id: '2' })], 0);
			});

			const { result: _message1 } = renderHook(() => useMessageById('1'));
			expect(_message1.current).not.toBeUndefined();
			const { result: _message2 } = renderHook(() => useMessageById('1'));
			expect(_message2.current).not.toBeUndefined();

			act(() => {
				removeMessages(['1', '2']);
			});

			const { result: message1 } = renderHook(() => useMessageById('1'));
			expect(message1.current).toBeUndefined();
			const { result: message2 } = renderHook(() => useMessageById('2'));
			expect(message2.current).toBeUndefined();
		});
	});
});
