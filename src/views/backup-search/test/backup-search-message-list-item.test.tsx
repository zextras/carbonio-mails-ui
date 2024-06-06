/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';
import { BackupSearchMessageListItem } from '../parts/backup-search-message-list-item';

describe('Backup search list', () => {
	it('should render the backup search message list items correctly', async () => {
		const message1 = {
			messageId: '1',
			folderId: 'folder 1',
			owner: 'francesco',
			creationDate: '2024-03-01T12:00:00Z',
			deletionDate: '2024-06-12T12:00:00Z',
			subject: 'subject',
			sender: 'francesco@example.com',
			to: 'giuliano@example.com',
			fragment: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aliquid repellat officia'
		};
		const messages = [message1];
		useBackupSearchStore.getState().setMessages(messages);
		const backupSearchStoreStateMessages = useBackupSearchStore.getState().messages;
		const message = backupSearchStoreStateMessages['1'];

		setupTest(
			<BackupSearchMessageListItem
				message={message}
				toggle={jest.fn()}
				key={message.id}
				messageIsSelected={false}
			/>,
			{}
		);

		expect(screen.getByText('3/1/2024')).toBeInTheDocument();
		expect(screen.getByText(message1.subject)).toBeInTheDocument();
		expect(screen.getByText(message1.sender)).toBeInTheDocument();
	});
});
