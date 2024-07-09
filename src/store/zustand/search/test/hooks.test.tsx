/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { act, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { useConversation, useHandleSearchResults } from '../hooks/hooks';
import { useSearchStore } from '../store';

const TestComponent = (props: { id: string }): ReactElement => {
	const { subject } = useConversation(props.id);
	return <>{subject}</>;
};

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
		useSearchStore.setState({
			conversations: {
				[conversation.id]: conversation
			}
		});
		setupTest(<TestComponent id="1" />);
		expect(screen.getByText('Test conversation')).toBeInTheDocument();
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
		useSearchStore.setState({
			conversations: {
				[conversation.id]: conversation
			}
		});
		setupTest(<TestComponent id="1" />);
		expect(screen.getByText('Test conversation')).toBeInTheDocument();
		act(() => {
			useSearchStore.setState({
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
		const { result } = renderHook(() => useHandleSearchResults({ searchResponse, offset: 0 }));
		expect(result.current).toBeUndefined();
		expect(useSearchStore.getState().conversations['123']).toBeDefined();
	});
});
