/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import {
	removeMessages,
	resetSearch,
	updateConversationMessages,
	updateConversations,
	updateConversationsOnly,
	updateConversationStatus,
	updateMessages,
	updateMessagesOnly,
	updateMessagesParent,
	useConversationById,
	useConversationMessages,
	useConversationStatus,
	useMessageById
} from './store';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
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

		it('should not unset fields on conversation', () => {
			updateConversations([generateConversation({ id: '1', folderId: FOLDERS.INBOX })], 0);
			updateConversationsOnly([generateConversation({ id: '1', folderId: undefined })]);

			const { result } = renderHook(() => useConversationById('1'));

			expect(result.current.parent).toEqual(FOLDERS.INBOX);
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

		it('should not override other conversation messages', async () => {
			const conversation1Messages = [
				generateMessage({ id: '1' }),
				generateMessage({ id: '2' }),
				generateMessage({ id: '3' })
			];
			const conversation1 = generateConversation({ id: '1', messages: conversation1Messages });
			const conversation2Messages = [generateMessage({ id: '4' }), generateMessage({ id: '5' })];
			const conversation2 = generateConversation({ id: '2', messages: conversation2Messages });
			updateConversations([conversation1, conversation2], 0);
			updateMessages([...conversation1Messages, ...conversation2Messages], 0);

			updateConversationMessages('1', [generateMessage({ id: '100' })]);

			const { result: conversation2StoreMessages } = renderHook(() => useConversationMessages('2'));
			const messages2 = conversation2StoreMessages.current;
			expect(messages2).toHaveLength(2);
			expect(messages2[0].id).toBe('4');
			expect(messages2[1].id).toBe('5');
		});

		it('should reset the searches and populated items', () => {
			updateConversations([generateConversation({ id: '1', messages: [] })], 0);
			updateConversationStatus('1', API_REQUEST_STATUS.fulfilled);
			updateMessages([generateMessage({ id: '100' })], 0);

			resetSearch();

			expect(renderHook(() => useConversationById('1')).result.current).toBeUndefined();
			expect(renderHook(() => useConversationStatus('1')).result.current).toBeUndefined();
			expect(renderHook(() => useMessageById('100')).result.current).toBeUndefined();
		});
	});

	describe('messages', () => {
		it('should set and return a message', () => {
			const message = generateMessage({ id: '1' });
			updateMessages([message], 0);

			const { result } = renderHook(() => useMessageById('1'));

			expect(result.current).toEqual(message);
		});

		it('should not unset fields on message', () => {
			updateMessages([generateMessage({ id: '1', folderId: FOLDERS.INBOX })], 0);

			updateMessagesOnly([generateMessage({ id: '1', folderId: undefined })]);

			const { result } = renderHook(() => useMessageById('1'));

			expect(result.current.parent).toEqual(FOLDERS.INBOX);
		});

		it('should update and return messages parent', () => {
			updateMessages([generateMessage({ id: '1' }), generateMessage({ id: '2' })], 0);

			const newFolder = 'newFolder';
			updateMessagesParent(newFolder, ['1', '2']);

			expect(renderHook(() => useMessageById('1')).result.current.parent).toBe(newFolder);
			expect(renderHook(() => useMessageById('2')).result.current.parent).toBe(newFolder);
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
