/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';

import * as folderHooks from '../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { generateFolder } from '../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';
import { DeletedMessageFromAPI, Folder } from '../../../types';
import { BackupSearchPanel } from '../parts/backup-search-panel';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

function mockItemIdParam(itemId: string | undefined): void {
	(useParams as jest.Mock).mockReturnValue({ itemId });
}

function setStoredMessages(storedMessages: DeletedMessageFromAPI[]): void {
	useBackupSearchStore.getState().setMessages(storedMessages);
}

function mockGetFolder(returnValue: Folder | undefined): void {
	jest.spyOn(folderHooks, 'getFolder').mockReturnValue(returnValue);
}

function aDeletedMessageWith(overrides: Partial<DeletedMessageFromAPI>): DeletedMessageFromAPI {
	return {
		messageId: '1',
		folderId: '10',
		owner: 'Owner Name',
		creationDate: '2024-05-11T12:00:00Z',
		deletionDate: '2024-05-27T12:00:00Z',
		subject: 'The Message Subject',
		sender: 'sender@example.com',
		to: 'recipient@example.com',
		fragment: 'This is a fragment of the message.',
		...overrides
	};
}

describe('Backup search panel', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows fallback title and description without itemId param', () => {
		mockItemIdParam(undefined);

		setupTest(<BackupSearchPanel />, {});

		expect(screen.getByText('label.displayer_restore_emails_title')).toBeInTheDocument();
		expect(screen.getByText('label.displayer_restore_emails_description')).toBeInTheDocument();
	});

	it('shows fallback title and description with unexisting itemId param', () => {
		mockItemIdParam('99');

		setupTest(<BackupSearchPanel />, {});

		expect(screen.getByText('label.displayer_restore_emails_title')).toBeInTheDocument();
		expect(screen.getByText('label.displayer_restore_emails_description')).toBeInTheDocument();
	});

	it('renders message details of a stored message with folder inbox', () => {
		const testMessageId = '1';
		mockItemIdParam(testMessageId);
		mockGetFolder(generateFolder({ name: 'Inbox' }));
		setStoredMessages([
			aDeletedMessageWith({
				messageId: testMessageId,
				subject: 'Test Subject',
				sender: 'sender@example.com',
				to: 'recipient@example.com',
				creationDate: '2024-06-06T12:00:00Z',
				deletionDate: '2024-06-07T12:00:00Z'
			})
		]);

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
		expect(screen.getByText('label.folder :')).toBeInTheDocument();
		expect(screen.getByText('Inbox')).toBeInTheDocument();
	});

	it('handle message details renders with unknown folder id', () => {
		const testMessageId = '1';
		mockItemIdParam(testMessageId);
		mockGetFolder(undefined);
		setStoredMessages([
			aDeletedMessageWith({
				messageId: testMessageId,
				folderId: 'unknown',
				subject: 'Another Message Subject'
			})
		]);

		setupTest(<BackupSearchPanel />, {});

		expect(screen.getByText('Another Message Subject')).toBeInTheDocument();
		expect(screen.queryByText('label.folder :')).not.toBeInTheDocument();
		expect(screen.queryByText('Inbox')).not.toBeInTheDocument();
	});
});
