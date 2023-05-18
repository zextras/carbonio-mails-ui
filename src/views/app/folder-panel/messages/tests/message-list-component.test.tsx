/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { noop, times } from 'lodash';
import React from 'react';
import { screen } from '@testing-library/react';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../../tests/generators/store';
import { MessageListComponent, MessageListComponentProps } from '../message-list-component';
import { MessageListItemComponent } from '../message-list-item-component';

describe.each`
	type                     | isSearchModule
	${'message list'}        | ${false}
	${'search message list'} | ${true}
`('$type component', ({ isSearchModule }) => {
	test('populate a message list and check that the messages are visible', async () => {
		// Populate a message list
		const MESSAGES_COUNT = 100;
		const folderId = FOLDERS.INBOX;
		const messages = times(MESSAGES_COUNT, (index) =>
			generateMessage({ id: `${index}`, folderId })
		);

		const listItems = messages.map((message) => (
			<MessageListItemComponent
				message={message}
				selected={{}}
				isSelected={false}
				active
				toggle={noop}
				isSelectModeOn={false}
				key={message.id}
				isSearchModule={isSearchModule}
				deselectAll={noop}
				visible
			/>
		));

		const props: MessageListComponentProps = {
			deselectAll: noop,
			displayerTitle: 'test',
			folderId,
			isAllSelected: false,
			isSelectModeOn: false,
			listItems,
			messages,
			messagesLoadingCompleted: true,
			selectAll: noop,
			selectAllModeOff: noop,
			selected: {},
			selectedIds: [],
			setIsSelectModeOn: noop,
			isSearchModule,
			totalMessages: messages.length,
			setDraggedIds: noop
		};

		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: {
					...messages.map((msg) => ({ [msg.id]: msg }))
				},
				status: {}
			}
		});

		setupTest(<MessageListComponent {...props} />, { store });

		await screen.findByTestId(`message-list-${folderId}`);
		const items = await screen.findAllByTestId(/MessageListItem-/);

		// Test that there is a list item for each message
		expect(items.length).toBe(messages.length);

		// Test that every list item is visible
		items.forEach((item) => {
			expect(item).toBeVisible();
		});
	});
});
