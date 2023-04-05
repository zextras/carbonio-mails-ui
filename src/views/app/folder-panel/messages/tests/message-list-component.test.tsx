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

describe('Message list component', () => {
	test('populate a message list and check that the messages are visible', async () => {
		// Populate a message list
		const MESSAGE_COUNT = 100;
		const folderId = FOLDERS.INBOX;
		const messages = times(MESSAGE_COUNT, () => generateMessage({ folderId }));

		const listItems = messages.map((message) => (
			<MessageListItemComponent
				message={message}
				selected={{}}
				isSelected={false}
				isActive
				toggle={noop}
				isSelectModeOn={false}
				key={message.id}
				deselectAll={noop}
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
			totalMessages: messages.length
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
		expect(items.length).toBe(messages.length);
	});
});
