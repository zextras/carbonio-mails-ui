/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react-hooks';

import { generateConversation } from '../../../../tests/generators/generateConversation';
import { SoapConversation } from '../../../../types';
import {
	getConversationById,
	messageStoreActions,
	useConversationById
} from '../../message-store/store';
import { handleSearchResults } from '../hooks/hooks';

function conversationFromAPI(params: Partial<SoapConversation> = {}): SoapConversation {
	return {
		id: '123',
		n: 1,
		u: 1,
		f: 'flag',
		tn: 'tag names',
		d: 123,
		m: [],
		e: [],
		su: 'Subject',
		fr: 'fragment',
		...params
	};
}
describe('Searches store hooks', () => {
	it('useConversationById should return a conversation', () => {
		const conversation = generateConversation({ id: '1', subject: 'Test conversation' });
		messageStoreActions.updateConversations([conversation], 0);
		const { result } = renderHook(() => useConversationById('1'));
		expect(result.current).toEqual(conversation);
	});

	it('handleSearchResults should update the store', () => {
		const searchResponse = {
			c: [conversationFromAPI({ id: '123', su: 'Subject' })],
			more: false
		};
		handleSearchResults({ searchResponse, offset: 0 });
		expect(getConversationById('123')).toBeDefined();
	});
});
