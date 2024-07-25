/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { renderHook } from '@testing-library/react-hooks';

import {
	updateConversations,
	updateConversationStatus,
	useConversationById,
	useConversationStatus
} from './store';
import { API_REQUEST_STATUS } from '../../../constants';
import { generateConversation } from '../../../tests/generators/generateConversation';

describe('message store', () => {
	describe('conversation', () => {
		it('should set and return a conversation', () => {
			const conversation = generateConversation({ id: '1', subject: 'Test conversation' });
			updateConversations([conversation], 0);

			const { result } = renderHook(() => useConversationById('1'));

			expect(result.current).toEqual(conversation);
		});
	});

	describe('conversationStatus', () => {
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
});
