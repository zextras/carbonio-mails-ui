/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { useParams } from 'react-router-dom';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import { createAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { useBackupSearchStore } from 'store/backup-search/store';
import { BackupSearchList } from 'views/backup-search/parts/backup-search-list';

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

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useParams: vi.fn()
}));

describe('Backup search list', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(useParams as Mock).mockReturnValue({ itemId: message1.messageId });
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

	it('should call recover selected emails and show the snackbar', async () => {
		const apiInterceptor = createAPIInterceptor(
			'post',
			'/zx/backup/v1/restoreMessages',
			new HttpResponse(null, { status: 204 })
		);
		useBackupSearchStore.getState().setMessages([message1]);

		const { user } = setupTest(<BackupSearchList />, {});

		const selectAllButton = screen.getByText(LABEL_SELECT_ALL);
		user.click(selectAllButton);
		await waitFor(() => {
			expect(screen.getByText(LABEL_DESELECT_ALL)).toBeInTheDocument();
		});
		const listRecoveryButton = screen.getByText(LABEL_RECOVER_EMAILS);
		await user.click(listRecoveryButton);
		const modalRecoveryButton = screen.getByText('label.start_recovery');
		expect(modalRecoveryButton).toBeInTheDocument();
		await user.click(modalRecoveryButton);
		expect(apiInterceptor.getCalledTimes()).toEqual(1);

		await waitFor(() => {
			expect(modalRecoveryButton).not.toBeInTheDocument();
		});

		await screen.findByText('label.recover_emails');
	});
	it('shows error snackbar on recovery failure', async () => {
		const apiInterceptor = createAPIInterceptor(
			'post',
			'/zx/backup/v1/restoreMessages',
			HttpResponse.error()
		);
		useBackupSearchStore.getState().setMessages([message1]);

		const { user } = setupTest(<BackupSearchList />, {});

		const selectAllButton = screen.getByText(LABEL_SELECT_ALL);
		await user.click(selectAllButton);
		await screen.findByText('label.all_items_selected');
		await waitFor(() => {
			expect(screen.getByText(LABEL_DESELECT_ALL)).toBeInTheDocument();
		});
		const listRecoveryButton = screen.getByText(LABEL_RECOVER_EMAILS);
		await user.click(listRecoveryButton);
		const modalRecoveryButton = screen.getByText('label.start_recovery');
		expect(modalRecoveryButton).toBeInTheDocument();
		await user.click(modalRecoveryButton);
		expect(apiInterceptor.getCalledTimes()).toEqual(1);
		await screen.findByText('label.error_recovering_emails');
	});
});
