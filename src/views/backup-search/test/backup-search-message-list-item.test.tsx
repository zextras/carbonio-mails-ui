/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import {
	getFolder,
	getUserAccount
} from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';
import { BackupSearchMessageListItem } from '../parts/backup-search-message-list-item';

const message1 = {
	messageId: '1',
	folderId: '1',
	owner: 'francesco',
	creationDate: '2024-03-01T12:00:00Z',
	deletionDate: '2024-06-12T12:00:00Z',
	subject: 'subject',
	sender: 'francesco@example.com',
	to: 'giuliano@example.com',
	fragment: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aliquid repellat officia'
};

describe('Backup search list', () => {
	it('should display To when sender is the owner', async () => {
		(getUserAccount as jest.Mock).mockReturnValue({
			name: 'francesco@example.com'
		});
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
		expect(screen.getByText(message1.to)).toBeInTheDocument();
		expect(screen.getByText('Inbox')).toBeInTheDocument();
		expect(screen.queryByText(message1.sender)).not.toBeInTheDocument();
	});

	it('should display inbox chip', async () => {
		(getFolder as jest.Mock).mockReturnValue({ name: 'Inbox' });

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

		expect(screen.getByText('Inbox')).toBeInTheDocument();
	});

	it('should display Deleted Folder if no folder is found', async () => {
		(getFolder as jest.Mock).mockReturnValue(undefined);

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

		expect(screen.getByText('label.deleted_folder')).toBeInTheDocument();
	});
	it('should display sender when to is the owner', async () => {
		(getUserAccount as jest.Mock).mockReturnValue({
			name: 'giuliano@example.com'
		});
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
		expect(screen.queryByText(message1.to)).not.toBeInTheDocument();
		expect(screen.getByText(message1.sender)).toBeInTheDocument();
	});
});
