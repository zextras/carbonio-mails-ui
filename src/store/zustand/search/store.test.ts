/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useSearchStore } from './store';

describe('Searches store', () => {
	it('should return a conversation when getConversation is called', () => {
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

		expect(useSearchStore.getState().getConversation(conversation.id)).toEqual(conversation);
	});
});
