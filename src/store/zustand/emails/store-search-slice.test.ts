/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react';
import { enableMapSet } from 'immer';

import {
	setSearchResultsByConversation,
	updateConversationStatus,
	setMessagesInSearchSlice,
	resetSearchAndPopulatedItems,
	useConversationById,
	useConversationStatus,
	useMessageById,
	setSearchResultsByMessage,
	deleteConversationsFromSearch,
	useSearchResults,
	appendMessagesToSearch,
	deleteMessagesFromSearch
} from './store';
import { API_REQUEST_STATUS } from '../../../constants';
import { generateConversation } from '../../../tests/generators/generateConversation';
import { generateMessage } from '../../../tests/generators/generateMessage';

describe('emails store search slice', () => {
	describe('resetSearchAndPopulatedItems', () => {
		it('should reset the searches and populated items', () => {
			setSearchResultsByConversation([generateConversation({ id: '1', messages: [] })], false);
			updateConversationStatus('1', API_REQUEST_STATUS.fulfilled);
			setMessagesInSearchSlice([generateMessage({ id: '100' })]);

			resetSearchAndPopulatedItems();

			expect(renderHook(() => useConversationById('1')).result.current).toBeUndefined();
			expect(renderHook(() => useConversationStatus('1')).result.current).toBeUndefined();
			expect(renderHook(() => useMessageById('100')).result.current).toBeUndefined();
		});
	});

	describe('setMessagesInSearchSlice', () => {
		it('should set and return a message', () => {
			const message = generateMessage({ id: '1' });
			setMessagesInSearchSlice([message]);

			const { result } = renderHook(() => useMessageById('1'));

			expect(result.current).toEqual(message);
		});
	});

	describe('deleteConversationsFromSearch', () => {
		it('should delete conversations from the state', () => {
			const conversation1Messages = [
				generateMessage({ id: '1' }),
				generateMessage({ id: '2' }),
				generateMessage({ id: '3' })
			];
			const conversation1 = generateConversation({ id: '1', messages: conversation1Messages });
			const conversation2Messages = [generateMessage({ id: '4' }), generateMessage({ id: '5' })];
			const conversation2 = generateConversation({ id: '2', messages: conversation2Messages });
			setSearchResultsByConversation([conversation1, conversation2], false);
			setMessagesInSearchSlice([...conversation1Messages, ...conversation2Messages]);

			deleteConversationsFromSearch(['1']);

			const { result } = renderHook(() => useSearchResults());
			const { result: conversation1Store } = renderHook(() => useConversationById('1'));
			const { result: conversation2Store } = renderHook(() => useConversationById('2'));
			expect(result.current.conversationIdSet.size).toBe(1);
			expect(result.current.conversationIdSet.has('1')).toBe(false);
			expect(result.current.conversationIdSet.has('2')).toBe(true);
			expect(conversation1Store.current).toBeUndefined();
			expect(conversation2Store.current).toBeDefined();
		});
	});

	describe('appendMessagesToSearch', () => {
		it('should append messages to the store', () => {
			enableMapSet();
			setMessagesInSearchSlice([generateMessage({ id: '1' })]);

			appendMessagesToSearch([generateMessage({ id: '2' }), generateMessage({ id: '3' })], 0);

			expect(renderHook(() => useMessageById('1')).result.current).toBeDefined();
			expect(renderHook(() => useMessageById('2')).result.current).toBeDefined();
			expect(renderHook(() => useMessageById('3')).result.current).toBeDefined();
		});
	});

	describe('deleteMessagesFromSearch', () => {
		it('should delete messages from populatedItems and messageIds', () => {
			const messages = [
				generateMessage({ id: '1' }),
				generateMessage({ id: '2' }),
				generateMessage({ id: '3' })
			];
			setSearchResultsByMessage(messages, false);
			setMessagesInSearchSlice(messages);

			deleteMessagesFromSearch(['1', '2']);

			const { result } = renderHook(() => useSearchResults());
			const { result: message1 } = renderHook(() => useMessageById('1'));
			const { result: message2 } = renderHook(() => useMessageById('2'));
			const { result: message3 } = renderHook(() => useMessageById('3'));
			expect(result.current.messageIdSet.size).toBe(1);
			expect(result.current.messageIdSet.has('3')).toBeTruthy();
			expect(message1.current).toBeUndefined();
			expect(message2.current).toBeUndefined();
			expect(message3.current).toBeDefined();
		});
	});
});
