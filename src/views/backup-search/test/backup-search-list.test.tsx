/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';
import { BackupSearchList } from '../parts/backup-search-list';
import { useParams } from 'react-router-dom';

const message1 = {
	messageId: '1',
	folderId: '2',
	owner: 'ownerName',
	creationDate: '2024-06-06T12:00:00Z',
	deletionDate: '2024-06-07T12:00:00Z',
	subject: 'Test Subject 1',
	sender: 'sender@example.com',
	to: 'recipient@example.com',
	fragment: 'This is a fragment of the message.'
};
const LABEL_SELECT_ALL = 'label.select_all';
const LABEL_DESELECT_ALL = 'label.deselect_all';
const LABEL_RECOVER_EMAILS = 'label.recover_selected_emails';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

jest.mock('./recoverEmailsCallback', () => ({
	recoverEmailsCallback: jest.fn()
}));

describe('Backup search list', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should selects and deselects all messages pressing select / deselect all', async () => {
		useBackupSearchStore.getState().setMessages([message1]);
		const { user } = setupTest(<BackupSearchList />, {});

		const selectButton = screen.getByText(LABEL_SELECT_ALL);
		user.click(selectButton);
		await waitFor(() => {
			expect(screen.getByText(LABEL_DESELECT_ALL)).toBeInTheDocument();
		});

		const deselectButton = screen.getByText(LABEL_DESELECT_ALL);
		user.click(deselectButton);
		await waitFor(() => {
			expect(screen.getByText(LABEL_SELECT_ALL)).toBeInTheDocument();
		});
	});

	it('should call recover selected emails', async () => {
		// mock api
		(useParams as jest.Mock).mockReturnValue({ itemId: '1' });

		const createSnackbar = jest.fn();
		useBackupSearchStore.getState().setMessages([message1]);

		const { user } = setupTest(<BackupSearchList />, {});

		const selectButton = screen.getByText(LABEL_SELECT_ALL);
		user.click(selectButton);
		await waitFor(() => {
			expect(screen.getByText(LABEL_DESELECT_ALL)).toBeInTheDocument();
		});

		const recoverButton = screen.getByText(LABEL_RECOVER_EMAILS);
		await user.click(recoverButton);
		expect(recoverEmailsCallback).toHaveBeenCalledTimes(1);
		await waitFor(() => {
			expect(createSnackbar).toHaveBeenCalledWith({
				replace: true,
				type: 'info',
				label: 'The recovery process has started, you will be informed once it is complete',
				autoHideTimeout: 5000,
				hideButton: true
			});
		});
	});
	it('shows error snackbar on recovery failure', async () => {
		// mock error
		const createSnackbar = jest.fn();
		useBackupSearchStore.getState().setMessages([message1]);

		const { user } = setupTest(<BackupSearchList />, {});

		const selectButton = screen.getByText(LABEL_SELECT_ALL);
		user.click(selectButton);

		await waitFor(() => {
			expect(screen.getByText(LABEL_DESELECT_ALL)).toBeInTheDocument();
		});
		const recoverButton = screen.getByText(LABEL_RECOVER_EMAILS);
		user.click(recoverButton);

		await waitFor(() => {
			expect(createSnackbar).toHaveBeenCalledWith({
				replace: true,
				type: 'error',
				label: 'Error recovering emails',
				autoHideTimeout: 5000,
				hideButton: true
			});
		});
	});
});
