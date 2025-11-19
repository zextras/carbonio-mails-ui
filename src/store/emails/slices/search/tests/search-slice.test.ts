/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';

import { API_REQUEST_STATUS } from 'constants/index';
import {
	setSearchResultsByConversation,
	updateConversationStatus,
	useConversationById,
	useMessageById,
	setSearchResultsByMessage,
	handleNotifyConversationsDeletionInSearch,
	useSearchResults,
	appendMessagesToSearch,
	handleNotifyMessagesDeletionInSearch,
	getUseEmailStoreAndHooksForTesting,
	setConversationsInEmailStore,
	resetSearchAndPopulatedItems
} from 'store/emails/store';
import { generateConversation } from '__test__/generators/generateConversation';
import { generateMessage } from '__test__/generators/generateMessage';

const { setMessagesInSearchSlice } = getUseEmailStoreAndHooksForTesting();
describe('emails store search slice', () => {
	describe('resetSearchAndPopulatedItems', () => {
		it('should reset the searchIndexSlice to the initial state', async () => {
			setSearchResultsByConversation([generateConversation({ id: '1', messageIds: [] })], false);
			updateConversationStatus('1', API_REQUEST_STATUS.fulfilled);
			await act(async () => {
				setMessagesInSearchSlice([generateMessage({ id: '100' })]);
			});
			resetSearchAndPopulatedItems();

			expect(renderHook(() => useSearchResults()).result.current.conversationListIndex).toEqual([]);
			expect(renderHook(() => useSearchResults()).result.current.messageListIndex).toEqual([]);
		});

		it('should remove conversations that are not in conversationListIndex while keeping the ones that are', async () => {
			const conversation1 = generateConversation({ id: '1' });
			const conversation2 = generateConversation({ id: '2' });
			setConversationsInEmailStore([conversation1], false);
			await act(async () => {
				setSearchResultsByConversation([conversation1, conversation2], false);
			});
			resetSearchAndPopulatedItems();

			expect(renderHook(() => useConversationById('1')).result.current).toBeDefined();
			await waitFor(async () => {
				expect(renderHook(() => useConversationById('2')).result.current).toBeUndefined();
			});
		});

		it('should remove messages that are not in messageListIndex while keeping the ones that are', async () => {
			const message1 = generateMessage({ id: '1' });
			const message2 = generateMessage({ id: '2' });
			setMessagesInSearchSlice([message1]);
			await act(async () => {
				setSearchResultsByMessage([message1, message2], false);
			});
			resetSearchAndPopulatedItems();

			await act(async () => {
				expect(renderHook(() => useMessageById('1')).result.current).toBeDefined();
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('2')).result.current).toBeUndefined();
			});
		});
	});

	describe('setMessagesInSearchSlice', () => {
		it('should set and return a message', async () => {
			const message = generateMessage({ id: '1' });
			await waitFor(() => {
				setMessagesInSearchSlice([message]);
			});
			const { result } = renderHook(() => useMessageById('1'));

			expect(result.current).toEqual(message);
		});
	});

	describe('deleteConversationsFromSearch', () => {
		it('should delete conversations from the state', async () => {
			const conversation1Messages = [
				generateMessage({ id: '1' }),
				generateMessage({ id: '2' }),
				generateMessage({ id: '3' })
			];
			const conversation1 = generateConversation({
				id: '1',
				messageIds: conversation1Messages.map((message) => message.id)
			});
			const conversation2Messages = [generateMessage({ id: '4' }), generateMessage({ id: '5' })];
			const conversation2 = generateConversation({
				id: '2',
				messageIds: conversation2Messages.map((message) => message.id)
			});
			setSearchResultsByConversation([conversation1, conversation2], false);
			await waitFor(() => {
				setMessagesInSearchSlice([...conversation1Messages, ...conversation2Messages]);
			});
			handleNotifyConversationsDeletionInSearch(['1']);

			const { result } = renderHook(() => useSearchResults());
			const { result: conversation1Store } = renderHook(() => useConversationById('1'));
			const { result: conversation2Store } = renderHook(() => useConversationById('2'));
			expect(result.current.conversationListIndex.length).toBe(1);
			expect(result.current.conversationListIndex.includes('1')).toBe(false);
			expect(result.current.conversationListIndex.includes('2')).toBe(true);
			expect(conversation1Store.current).toBeUndefined();
			expect(conversation2Store.current).toBeDefined();
		});
	});

	describe('appendMessagesToSearch', () => {
		it('should append messages to the store', async () => {
			await waitFor(() => {
				setMessagesInSearchSlice([generateMessage({ id: '1' })]);
			});
			appendMessagesToSearch([generateMessage({ id: '2' }), generateMessage({ id: '3' })], 0);

			expect(renderHook(() => useMessageById('1')).result.current).toBeDefined();
			expect(renderHook(() => useMessageById('2')).result.current).toBeDefined();
			expect(renderHook(() => useMessageById('3')).result.current).toBeDefined();
		});
	});

	describe('deleteMessagesFromSearch', () => {
		it('should delete messages from populatedItems and messageIds', async () => {
			const messages = [
				generateMessage({ id: '1' }),
				generateMessage({ id: '2' }),
				generateMessage({ id: '3' })
			];
			setSearchResultsByMessage(messages, false);
			await waitFor(() => {
				setMessagesInSearchSlice(messages);
			});
			handleNotifyMessagesDeletionInSearch(['1', '2']);

			const { result } = renderHook(() => useSearchResults());
			const { result: message1 } = renderHook(() => useMessageById('1'));
			const { result: message2 } = renderHook(() => useMessageById('2'));
			const { result: message3 } = renderHook(() => useMessageById('3'));
			expect(result.current.messageListIndex.length).toBe(1);
			expect(result.current.messageListIndex.includes('3')).toBeTruthy();
			expect(message1.current).toBeUndefined();
			expect(message2.current).toBeUndefined();
			expect(message3.current).toBeDefined();
		});
	});
});
