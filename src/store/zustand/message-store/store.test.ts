/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { renderHook } from '@testing-library/react-hooks';
import produce from 'immer';

import {
	updateConversationStatus,
	useConversationById,
	useConversationStatus,
	useMessageStore
} from './store';
import { API_REQUEST_STATUS } from '../../../constants';
import { generateConversation } from '../../../tests/generators/generateConversation';

describe('useMessageStore', () => {
	describe('useConversationById', () => {
		it('should return a conversation', () => {
			const conversation = generateConversation({ id: '1', subject: 'Test conversation' });
			useMessageStore.setState(
				produce((state) => {
					state.search.conversationIds = new Set(['1']);
					state.populatedItems.conversations = { '1': conversation };
				})
			);

			const { result } = renderHook(() => useConversationById('1'));
			expect(result.current).toEqual(conversation);
		});
	});

	describe('updateConversationStatus', () => {
		it('should set conversation status in the store', () => {
			renderHook(() => updateConversationStatus('123', API_REQUEST_STATUS.pending));

			const conversationsStatus =
				useMessageStore.getState().populatedItems.conversationsStatus['123'];
			expect(conversationsStatus).toBe(API_REQUEST_STATUS.pending);
		});
	});

	describe('useConversationStatus', () => {
		it('should get undefined if conversation loading status not present', () => {
			const { result } = renderHook(() => useConversationStatus('123'));

			expect(result.current).toBeUndefined();
		});

		it('should get conversation status if value present', () => {
			useMessageStore.setState(
				produce((state) => {
					state.populatedItems.conversationsStatus = {
						'123': API_REQUEST_STATUS.fulfilled
					};
				})
			);

			const { result } = renderHook(() => useConversationStatus('123'));

			expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
		});
	});
});
