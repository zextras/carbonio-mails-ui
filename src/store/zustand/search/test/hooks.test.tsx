/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { SoapConversation } from '../../../../types';
import { useMessageStore } from '../../message-store/store';
import { handleSearchResults, useConversation } from '../hooks/hooks';

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
	it('useConversation should return a conversation', () => {
		const conversation = generateConversation({ id: '1', subject: 'Test conversation' });
		useMessageStore.getState().search.setSearchConvResults([conversation], 0);
		// useMessageStore.setState({
		// 	populatedItems: {
		// 		conversations: { [conversation.id]: conversation },
		// 		messages: {},
		// 		setConversations: noop
		// 	}
		// });
		const { result } = renderHook(() => useConversation('1'));
		expect(result.current).toEqual(conversation);
	});

	it('useConversation should update the component', async () => {
		const conversation = {
			id: '1',
			date: 0,
			messages: [
				{
					id: '100',
					parent: '1',
					date: 0
				}
			],
			participants: [],
			subject: 'Test conversation',
			fragment: '',
			read: false,
			hasAttachment: false,
			flagged: false,
			urgent: false,
			tags: [],
			parent: '2',
			messagesInConversation: 0,
			sortIndex: 0
		};
		useMessageStore.setState({
			conversationIds: new Set([conversation.id])
		});
		useMessageStore.setState({ conversations: { [conversation.id]: conversation } });
		setupTest(<TestComponent id="1" />);
		expect(screen.getByText('Test conversation')).toBeInTheDocument();
		act(() => {
			useMessageStore.setState({
				conversations: { [conversation.id]: { ...conversation, subject: 'New subject' } }
			});
		});
		expect(await screen.findByText('New subject')).toBeInTheDocument();
	});

	it('useHandleSearchResults should update the store', () => {
		const searchResponse = {
			c: [conversationFromAPI({ id: '123', su: 'Subject' })],
			more: false
		};
		const { result } = renderHook(() => handleSearchResults({ searchResponse, offset: 0 }));
		expect(result.current).toBeUndefined();
		expect(useMessageStore.getState().conversations['123']).toBeDefined();
	});
});
