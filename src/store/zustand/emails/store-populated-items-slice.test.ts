/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react';

import {
	appendConversations,
	getSearchResultsLoadingStatus,
	setMessagesInSearchSlice,
	setSearchResultsByConversation,
	setSearchResultsByMessage,
	updateConversationsOnly,
	updateConversationStatus,
	updateMessages,
	updateMessagesOnly,
	updateMessageStatus,
	updateSearchResultsLoadingStatus,
	useConversationById,
	useConversationMessages,
	useConversationStatus,
	useMessageById,
	useMessageStatus
} from './store';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { API_REQUEST_STATUS } from '../../../constants';
import { generateConversation } from '../../../tests/generators/generateConversation';
import { generateMessage } from '../../../tests/generators/generateMessage';

describe('store-populated-items-slice', () => {
	describe('useConversationById', () => {
		it('should set and return a conversation', () => {
			const conversation = generateConversation({ id: '1' });
			setSearchResultsByConversation([conversation], false);

			const { result } = renderHook(() => useConversationById('1'));

			expect(result.current).toEqual(conversation);
		});
	});

	describe('useConversationStatus', () => {
		it('should get undefined if conversation loading status not present', () => {
			const { result } = renderHook(() => useConversationStatus('123'));

			expect(result.current).toBeUndefined();
		});
		it('should set and get conversation status if value present', () => {
			updateConversationStatus('123', API_REQUEST_STATUS.fulfilled);

			const { result } = renderHook(() => useConversationStatus('123'));

			expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
		});
	});

	describe('useMessageById', () => {
		it('should update populated store messages', () => {
			const message = generateMessage({ id: '1' });
			updateMessages([message]);

			const { result } = renderHook(() => useMessageById('1'));

			expect(result.current).toBe(message);
		});
	});
	describe('useConversationMessages', () => {
		it('should not override other conversation messages', async () => {
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

			updateMessages([generateMessage({ id: '100' })]);

			const { result: conversation2StoreMessages } = renderHook(() => useConversationMessages('2'));
			const messages2 = conversation2StoreMessages.current;
			expect(messages2).toHaveLength(2);
			expect(messages2[0].id).toBe('4');
			expect(messages2[1].id).toBe('5');
		});
	});

	describe('getSearchResultsLoadingStatus', () => {
		it('should update the search loading status when updateSearchResultsLoadingStatus is called', () => {
			setSearchResultsByConversation([generateConversation({ id: '1', messages: [] })], false);
			const { result } = renderHook(() => getSearchResultsLoadingStatus());

			expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);

			renderHook(() => updateSearchResultsLoadingStatus(API_REQUEST_STATUS.pending));
			const { result: searchStatusAfterUpdate } = renderHook(() => getSearchResultsLoadingStatus());

			expect(searchStatusAfterUpdate.current).toBe(API_REQUEST_STATUS.pending);
		});
	});
	describe('appendConversations', () => {
		it('should append conversations to the store when appendConversations is called', () => {
			setSearchResultsByConversation([generateConversation({ id: '1', messages: [] })], false);

			appendConversations(
				[generateConversation({ id: '2' }), generateConversation({ id: '3' })],
				0,
				false
			);

			expect(renderHook(() => useConversationById('1')).result.current).toBeDefined();
			expect(renderHook(() => useConversationById('2')).result.current).toBeDefined();
			expect(renderHook(() => useConversationById('3')).result.current).toBeDefined();
		});
	});
	describe('updateMessageStatus', () => {
		it('should set message status if value present', () => {
			updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);

			const { result } = renderHook(() => useMessageStatus('1'));

			expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
		});
	});
	describe('updateConversationsOnly', () => {
		it('should apply changes correctly', () => {
			const conversation = generateConversation({
				id: '1',
				tags: ['tag1']
			});

			setSearchResultsByConversation([conversation], false);

			const newConversation = {
				...conversation,
				tags: []
			};

			renderHook(() => updateConversationsOnly([newConversation]));
			const { result } = renderHook(() => useConversationById('1'));
			expect(result.current.tags).toEqual([]);
		});
	});
	describe('updateMessagesOnly', () => {
		it('should not unset fields on message', () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: FOLDERS.INBOX })]);

			updateMessagesOnly([generateMessage({ id: '1', folderId: undefined })]);

			const { result } = renderHook(() => useMessageById('1'));

			expect(result.current.parent).toEqual(FOLDERS.INBOX);
		});
	});
	describe('updateMessagesOnly', () => {
		it('should apply changes correctly', () => {
			const message1 = generateMessage({ id: '1', tags: ['tag1'] });
			const message2 = generateMessage({ id: '2', tags: ['tag2'] });
			setSearchResultsByMessage([message1, message2], false);

			const newMessage1 = { ...message1, tags: [] };
			const newMessage2 = { ...message2, tags: [] };

			renderHook(() => updateMessagesOnly([newMessage1, newMessage2]));
			const { result: resultMessage1 } = renderHook(() => useMessageById('1'));
			const { result: resultMessage2 } = renderHook(() => useMessageById('2'));
			expect(resultMessage1.current).toEqual(newMessage1);
			expect(resultMessage2.current).toEqual(newMessage2);
		});
	});
});
