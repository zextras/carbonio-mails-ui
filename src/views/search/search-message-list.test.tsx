/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { SearchMessageList } from './search-message-list';
import { setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { useMessagesStore } from '../../store/zustand/messages-store/store';
import { useSearchStore } from '../../store/zustand/search/store';
import { generateStore } from '../../tests/generators/store';
import { IncompleteMessage } from '../../types';

const incompleteMessage: IncompleteMessage = {
	body: { content: '', contentType: '' },
	conversation: '',
	date: 0,
	flagged: false,
	hasAttachment: false,
	id: '',
	isComplete: false,
	isDeleted: false,
	isDraft: false,
	isForwarded: false,
	isInvite: false,
	isReplied: false,
	isScheduled: false,
	isSentByMe: false,
	parent: '',
	parts: [],
	read: true,
	size: 0,
	subject: '',
	tags: [],
	urgent: false
};

describe('Search items list', () => {
	const store = generateStore();
	it('should display messages with subject', async () => {
		useSearchStore.setState({
			conversations: new Set(),
			messageIds: new Set(['1', '2', '3']),
			more: false,
			offset: 0,
			status: 'fulfilled'
		});
		useMessagesStore.setState({
			messages: {
				'1': { ...incompleteMessage, id: '1', subject: 'Message 1' },
				'2': { ...incompleteMessage, id: '2', subject: 'Message 2' },
				'3': { ...incompleteMessage, id: '3', subject: 'Message 3' }
			}
		});
		const state = useSearchStore.getState();

		setupTest(
			<SearchMessageList
				searchResults={state}
				query={'hello_there'}
				loading={false}
				filterCount={0}
				setShowAdvanceFilters={(): boolean => true}
				isInvalidQuery={false}
				searchDisabled={false}
			/>,
			{ store }
		);

		expect((await screen.findAllByTestId(/invisible-message*/)).length).toEqual(3);
	});
});
