/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';

import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';
import { BackupSearchPanel } from '../parts/backup-search-panel';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));
describe('Backup search panel', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders without itemId', () => {
		(useParams as jest.Mock).mockReturnValue({ itemId: undefined });

		setupTest(<BackupSearchPanel />, {});
		expect(screen.getByText('label.displayer_restore_emails_title')).toBeInTheDocument();
		expect(screen.getByText('label.displayer_restore_emails_description')).toBeInTheDocument();
	});

	it('renders with itemId and displays message details', () => {
		(useParams as jest.Mock).mockReturnValue({ itemId: '1' });
		const message = {
			messageId: '1',
			folderId: '2',
			owner: 'ownerName',
			creationDate: '2024-06-06T12:00:00Z',
			deletionDate: '2024-06-07T12:00:00Z',
			subject: 'Test Subject',
			sender: 'sender@example.com',
			to: 'recipient@example.com',
			fragment: 'This is a fragment of the message.'
		};

		useBackupSearchStore.getState().setMessages([message]);

		setupTest(<BackupSearchPanel />, {});

		expect(screen.getByText('label.subject :')).toBeInTheDocument();
		expect(screen.getByText('Test Subject')).toBeInTheDocument();
		expect(screen.getByText('label.from :')).toBeInTheDocument();
		expect(screen.getByText('sender@example.com')).toBeInTheDocument();
		expect(screen.getByText('label.to :')).toBeInTheDocument();
		expect(screen.getByText('recipient@example.com')).toBeInTheDocument();
		expect(screen.getByText('label.date_created :')).toBeInTheDocument();
		expect(screen.getByText('Thu, 06 Jun 2024 12:00:00 GMT')).toBeInTheDocument();
		expect(screen.getByText('label.date_deleted :')).toBeInTheDocument();
		expect(screen.getByText('Fri, 07 Jun 2024 12:00:00 GMT')).toBeInTheDocument();
	});
});
