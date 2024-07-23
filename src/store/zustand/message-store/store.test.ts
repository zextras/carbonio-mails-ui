/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { renderHook } from '@testing-library/react-hooks';

import { setConversationStatus, useConversationStatus, useMessageStore } from './store';
import { API_REQUEST_STATUS } from '../../../constants';

describe('Conversations', () => {
	describe('useConversationStatus', () => {
		it('should get undefined if conversation loading status not present', () => {
			const { result } = renderHook(() => useConversationStatus('123'));

			expect(result.current).toBeUndefined();
		});

		it('should get conversation status if value present', () => {
			const state = useMessageStore.getState();
			state.populatedItems.conversationsStatus = {
				'123': API_REQUEST_STATUS.fulfilled
			};
			useMessageStore.setState(state);

			const { result } = renderHook(() => useConversationStatus('123'));

			expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
		});
	});

	describe('setConversationStatus', () => {
		it('should set conversation status in the store', () => {
			renderHook(() => setConversationStatus('123', API_REQUEST_STATUS.pending));

			const conversationsStatus =
				useMessageStore.getState().populatedItems.conversationsStatus['123'];
			expect(conversationsStatus).toBe(API_REQUEST_STATUS.pending);
		});
	});
});
