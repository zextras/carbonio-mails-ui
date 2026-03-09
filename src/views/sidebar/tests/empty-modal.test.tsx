/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { act, screen } from '@testing-library/react';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { Folder, FOLDERS, getFolder, SoapFolderAction } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { EmptyModal } from 'views/sidebar/empty-modal';

describe('empty-modal', () => {
	test('wipe regular folder shows correct UI elements and warnings', async () => {
		const closeModal = vi.fn();

		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.string.uuid(),
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: FOLDERS.USER_ROOT,
			luuid: faker.string.uuid(),
			checked: false,
			f: 'ui',
			u: 37,
			rev: 1,
			ms: 2633,
			n: 889,
			s: 174031840,
			i4ms: 33663,
			i4next: 17222,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			acl: {
				grant: []
			},
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		};

		setupTest(<EmptyModal onClose={(): void => closeModal()} folder={folder} />, {});

		// Verify title with proper formatting
		expect(screen.getByText('label.empty: folders.inbox')).toBeInTheDocument();

		// Verify warning icon is present
		expect(screen.getByTestId('icon: AlertCircleOutline')).toBeInTheDocument();

		// Verify warning messages
		expect(screen.getByText('folder_panel.modal.empty.body.message1')).toBeInTheDocument();
		expect(screen.getByText('folder_panel.modal.empty.body.message2')).toBeInTheDocument();
		expect(screen.getByText('folder_panel.modal.empty.body.message3')).toBeInTheDocument();

		// Verify dividers are present (header divider and footer divider)
		const dividers = screen.getAllByTestId('divider');
		expect(dividers.length).toBe(2);

		const wipeButton = screen.getByRole('button', {
			name: 'folder_panel.modal.empty.folder.button.yes'
		});

		expect(wipeButton).toBeEnabled();

		const cancelButton = screen.getByRole('button', {
			name: 'folder_panel.modal.empty.folder.button.no'
		});
		expect(cancelButton).toBeEnabled();

		// Verify close button via icon
		expect(screen.getByTestId('icon: CloseOutline')).toBeInTheDocument();
	});

	test('empty trash folder shows correct UI elements and warnings', async () => {
		const closeModal = vi.fn();

		const folder: Folder = {
			id: `dfer4567-hy0e-i984-kjh6-c842dfr5tgyh:${FOLDERS.TRASH}`,
			uuid: faker.string.uuid(),
			name: 'Trash',
			absFolderPath: '/Trash',
			l: FOLDERS.USER_ROOT,
			luuid: faker.string.uuid(),
			checked: false,
			rev: 1,
			ms: 28502,
			n: 16,
			s: 319017,
			i4ms: 33653,
			i4next: 17212,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		};

		setupTest(<EmptyModal onClose={(): void => closeModal()} folder={folder} />, {});

		// Verify title with proper formatting
		expect(screen.getByText('label.empty: folders.trash')).toBeInTheDocument();

		// Verify error icon is present
		expect(screen.getByTestId('icon: AlertCircleOutline')).toBeInTheDocument();

		// Verify warning messages specific to trash
		expect(screen.getByText('folder_panel.modal.empty.body.message1')).toBeInTheDocument();
		expect(screen.getByText('folder_panel.modal.empty.body.message2')).toBeInTheDocument();
		expect(screen.getByText('folder_panel.modal.empty.body.message3')).toBeInTheDocument();

		// Verify dividers are present (header divider and footer divider)
		const dividers = screen.getAllByTestId('divider');
		expect(dividers.length).toBe(2);

		// Verify buttons
		const emptyButton = screen.getByRole('button', {
			name: 'folder_panel.modal.empty.trash.button.yes folders.trash'
		});
		expect(emptyButton).toBeEnabled();

		const cancelButton = screen.getByRole('button', {
			name: 'folder_panel.modal.empty.folder.button.no'
		});
		expect(cancelButton).toBeEnabled();

		// Verify close button via icon
		expect(screen.getByTestId('icon: CloseOutline')).toBeInTheDocument();
	});

	test('cancel button closes the modal without taking action', async () => {
		const closeModal = vi.fn();

		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.string.uuid(),
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: FOLDERS.USER_ROOT,
			luuid: faker.string.uuid(),
			checked: false,
			f: 'ui',
			u: 37,
			rev: 1,
			ms: 2633,
			n: 889,
			s: 174031840,
			i4ms: 33663,
			i4next: 17222,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			acl: {
				grant: []
			},
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		};

		const { user } = setupTest(
			<EmptyModal onClose={(): void => closeModal()} folder={folder} />,
			{}
		);

		const cancelButton = screen.getByRole('button', {
			name: 'folder_panel.modal.empty.folder.button.no'
		});

		await user.click(cancelButton);

		expect(closeModal).toHaveBeenCalledTimes(1);
	});

	test('close button (X icon) closes the modal without taking action', async () => {
		const closeModal = vi.fn();

		populateFoldersStore();
		const folder = getFolder(FOLDERS.TRASH);
		if (!folder) {
			return;
		}

		const { user } = setupTest(
			<EmptyModal onClose={(): void => closeModal()} folder={folder} />,
			{}
		);

		// Find close button by its icon
		const closeIcon = screen.getByTestId('icon: CloseOutline');
		// eslint-disable-next-line testing-library/no-node-access
		const closeButton = closeIcon.closest('button');
		expect(closeButton).toBeInTheDocument();

		if (closeButton) {
			await user.click(closeButton);
		}

		expect(closeModal).toHaveBeenCalledTimes(1);
	});

	test('API is called with the proper parameters', async () => {
		const closeModal = vi.fn();

		populateFoldersStore();
		const folder = getFolder(FOLDERS.TRASH);
		if (!folder) {
			return;
		}

		const { user } = setupTest(
			<EmptyModal onClose={(): void => closeModal()} folder={folder} />,
			{}
		);

		const emptyButton = screen.getByRole('button', {
			name: 'folder_panel.modal.empty.trash.button.yes folders.trash'
		});
		const wipeInterceptor = createSoapAPIInterceptor<{ action: SoapFolderAction }>('FolderAction');

		await act(() => user.click(emptyButton));

		const { action } = await wipeInterceptor;

		expect(action.id).toBe(FOLDERS.TRASH);
		expect(action.op).toBe('empty');
		expect(action.recursive).toBe(true);
	});

	test('should show success snackbar when trash is emptied successfully', async () => {
		const closeModal = vi.fn();

		populateFoldersStore();
		const folder = getFolder(FOLDERS.TRASH);
		if (!folder) {
			return;
		}

		const { user } = setupTest(
			<EmptyModal onClose={(): void => closeModal()} folder={folder} />,
			{}
		);

		const emptyButton = screen.getByRole('button', {
			name: 'folder_panel.modal.empty.trash.button.yes folders.trash'
		});

		const successInterceptor = createSoapAPIInterceptor<{ action: SoapFolderAction }>(
			'FolderAction'
		);

		await act(() => user.click(emptyButton));

		await successInterceptor;

		expect(await screen.findByText(/messages\.snackbar\.folder_empty/i)).toBeInTheDocument();
		expect(closeModal).toHaveBeenCalledTimes(1);
	});

	test('should show success snackbar when regular folder is wiped successfully', async () => {
		const closeModal = vi.fn();

		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.string.uuid(),
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: FOLDERS.USER_ROOT,
			luuid: faker.string.uuid(),
			checked: false,
			f: 'ui',
			u: 37,
			rev: 1,
			ms: 2633,
			n: 889,
			s: 174031840,
			i4ms: 33663,
			i4next: 17222,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			acl: {
				grant: []
			},
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		};

		const { user } = setupTest(
			<EmptyModal onClose={(): void => closeModal()} folder={folder} />,
			{}
		);

		const wipeButton = screen.getByRole('button', {
			name: 'folder_panel.modal.empty.folder.button.yes'
		});

		const successInterceptor = createSoapAPIInterceptor<{ action: SoapFolderAction }>(
			'FolderAction'
		);

		await act(() => user.click(wipeButton));

		await successInterceptor;

		expect(await screen.findByText('messages.snackbar.folder_emptied')).toBeInTheDocument();
		expect(closeModal).toHaveBeenCalledTimes(1);
	});

	test('should show an error snackbar when API returns a Fault', async () => {
		const closeModal = vi.fn();

		populateFoldersStore();
		const folder = getFolder(FOLDERS.TRASH);
		if (!folder) {
			return;
		}

		const { user } = setupTest(
			<EmptyModal onClose={(): void => closeModal()} folder={folder} />,
			{}
		);

		const emptyButton = screen.getByRole('button', {
			name: 'folder_panel.modal.empty.trash.button.yes folders.trash'
		});

		createSoapAPIInterceptor<{ action: SoapFolderAction }, ErrorSoapBodyResponse>(
			'FolderAction',
			buildSoapErrorResponseBody()
		);

		await act(() => user.click(emptyButton));

		expect(await screen.findByText(/label\.error_try_again/i)).toBeInTheDocument();
	});
});
