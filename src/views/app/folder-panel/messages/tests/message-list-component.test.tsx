/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { noop, times } from 'lodash';

import { setupTest } from '@test-setup';
import { setMessagesInEmailStore } from 'store/emails/store';
import { generateMessage } from '__test__/generators/generateMessage';
import {
	MessageListComponent,
	MessageListComponentProps
} from 'views/app/folder-panel/messages/message-list-component';
import { MessageListItemComponent } from 'views/app/folder-panel/messages/message-list-item-component';

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

		setMessagesInEmailStore(messages, false);
		const listItems = messages.map((message) => (
			<MessageListItemComponent
				deselectAll={noop}
				messageId={message.id}
				selectedItems={{}}
				isSelected={false}
				active
				isSelectModeOn={false}
				key={message.id}
				isSearchModule={isSearchModule}
				visible
				index={0}
				onSelect={noop}
			/>
		));

		const props: MessageListComponentProps = {
			deselectAll: noop,
			displayerTitle: 'test',
			folderId,
			messageIds: messages.map((msg) => msg.id),
			isAllSelected: false,
			isSelectModeOn: false,
			listItems,
			messagesLoadingCompleted: true,
			selectAll: noop,
			selectAllModeOff: noop,
			selectedIds: [],
			setIsSelectModeOn: noop,
			isSearchModule,
			totalMessages: messages.length
		};

		setupTest(<MessageListComponent {...props} />);

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
