/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { act, screen } from '@testing-library/react';

import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { useConversation } from '../hooks/hooks';
import { useSearchStore } from '../store';

const TestComponent = (props: { id: string }): ReactElement => {
	const { subject } = useConversation(props.id);
	return <>{subject}</>;
};

describe('Searches store', () => {
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
});
