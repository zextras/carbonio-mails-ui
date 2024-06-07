/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { CreateSnackbarFn, useSnackbar } from '@zextras/carbonio-design-system';
import { HttpResponse } from 'msw';
import { useParams } from 'react-router-dom';

import { createAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';
import { BackupSearchList } from '../parts/backup-search-list';

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

const createSnackbar = (arg: any): CreateSnackbarFn => arg;
const createSnackbarSpy = jest.fn(createSnackbar);

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));

describe('Backup search list', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		(useParams as jest.Mock).mockReturnValue({ itemId: message1.messageId });
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
			HttpResponse.json(null, { status: 202 })
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

		await waitFor(() => {
			expect(createSnackbarSpy).toHaveBeenCalledWith({
				replace: true,
				type: 'info',
				label: 'label.recover_emails',
				autoHideTimeout: 5000,
				hideButton: true
			});
		});
	});
	it('shows error snackbar on recovery failure', async () => {
		const apiInterceptor = createAPIInterceptor(
			'post',
			'/zx/backup/v1/restoreMessages',
			HttpResponse.json(null, { status: 504, type: 'error' })
		);
		useBackupSearchStore.getState().setMessages([message1]);

		const { user } = setupTest(<BackupSearchList />, {});

		const selectAllButton = screen.getByText(LABEL_SELECT_ALL);
		user.click(selectAllButton);
		await waitFor(() => {
			expect(createSnackbarSpy).toHaveBeenCalledWith({
				replace: true,
				type: 'info',
				label: 'label.all_items_selected',
				key: 'selected-all-backupMessages',
				autoHideTimeout: 5000,
				hideButton: true
			});
		});
		createSnackbarSpy.mockClear();
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
			expect(createSnackbarSpy).toHaveBeenCalledWith({
				replace: true,
				type: 'error',
				label: 'label.error_recovering_emails',
				autoHideTimeout: 5000,
				hideButton: true
			});
		});
	});
});
