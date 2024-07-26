/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { renderHook } from '@testing-library/react-hooks';

import {
	updateConversationMessages,
	updateConversations,
	updateConversationStatus,
	updateMessages,
	updateMessagesFlaggedStatus,
	updateMessagesParent,
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
	});
});
