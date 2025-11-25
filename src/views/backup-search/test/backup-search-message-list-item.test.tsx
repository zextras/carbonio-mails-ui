import React from 'react';

import { screen } from '@testing-library/react';
import { getFolder } from '@zextras/carbonio-ui-commons';
import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setupTest } from '@test-setup';
import { getUserAccount } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { useBackupSearchStore } from 'store/backup-search/store';
import { BackupSearchMessageListItem } from 'views/backup-search/parts/backup-search-message-list-item';

vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	getFolder: vi.fn()
}));

const deletedMessage = {
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
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display To when sender is the owner', async () => {
		(getUserAccount as Mock).mockReturnValue({
			name: 'francesco@example.com'
		});
		useBackupSearchStore.getState().setMessages([deletedMessage]);
		const backupSearchStoreStateMessages = useBackupSearchStore.getState().messages;
		const message = backupSearchStoreStateMessages['1'];

		setupTest(
			<BackupSearchMessageListItem
				message={message}
				index={0}
				onSelect={vi.fn()}
				key={message.id}
				messageIsSelected={false}
			/>,
			{}
		);

		expect(screen.getByText('3/1/2024')).toBeInTheDocument();
		expect(screen.getByText(deletedMessage.subject)).toBeInTheDocument();
		expect(screen.getByText(deletedMessage.to)).toBeInTheDocument();
		expect(screen.queryByText(deletedMessage.sender)).not.toBeInTheDocument();
	});

	it('should display inbox chip', async () => {
		(getFolder as Mock).mockReturnValue(generateFolder({ name: 'Inbox' }));

		useBackupSearchStore.getState().setMessages([deletedMessage]);
		const backupSearchStoreStateMessages = useBackupSearchStore.getState().messages;
		const message = backupSearchStoreStateMessages['1'];

		setupTest(
			<BackupSearchMessageListItem
				message={message}
				index={0}
				onSelect={vi.fn()}
				key={message.id}
				messageIsSelected={false}
			/>,
			{}
		);

		expect(screen.getByTestId('chip')).toHaveTextContent('Inbox');
	});

	it('should not display the chip if no folder is found', async () => {
		(getFolder as Mock).mockReturnValue(undefined);
		useBackupSearchStore.getState().setMessages([deletedMessage]);
		const backupSearchStoreStateMessages = useBackupSearchStore.getState().messages;
		const message = backupSearchStoreStateMessages['1'];

		setupTest(
			<BackupSearchMessageListItem
				message={message}
				index={0}
				onSelect={vi.fn()}
				key={message.id}
				messageIsSelected={false}
			/>,
			{}
		);

		expect(screen.queryByTestId('chip')).not.toBeInTheDocument();
	});

	it('should display sender when to is the owner', async () => {
		(getUserAccount as Mock).mockReturnValue({
			name: 'giuliano@example.com'
		});
		useBackupSearchStore.getState().setMessages([deletedMessage]);
		const backupSearchStoreStateMessages = useBackupSearchStore.getState().messages;
		const message = backupSearchStoreStateMessages['1'];

		setupTest(
			<BackupSearchMessageListItem
				message={message}
				index={0}
				onSelect={vi.fn()}
				key={message.id}
				messageIsSelected={false}
			/>,
			{}
		);

		expect(screen.getByText('3/1/2024')).toBeInTheDocument();
		expect(screen.getByText(deletedMessage.subject)).toBeInTheDocument();
		expect(screen.queryByText(deletedMessage.to)).not.toBeInTheDocument();
		expect(screen.getByText(deletedMessage.sender)).toBeInTheDocument();
	});
});
