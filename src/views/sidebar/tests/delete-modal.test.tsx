/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { act, screen } from '@testing-library/react';
import {
	Folder,
	FOLDERS,
	FolderView,
	getFolder,
	SoapFolderAction
} from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { FOLDER_ACTIONS } from 'commons/utilities';
import { getFolders } from 'hooks/use-folders';
import { DeleteModal } from 'views/sidebar/delete-modal';

describe('delete-modal', () => {
	test('delete the folder except the child of trash folder', async () => {
		const closeModal = vi.fn();

		const folder: Folder = {
			id: '106',
			uuid: faker.string.uuid(),
			name: 'Confluence',
			absFolderPath: '/Inbox/Confluence',
			l: FOLDERS.INBOX,
			luuid: faker.string.uuid(),
			checked: false,
			f: 'u',
			u: 25,
			view: 'message' as FolderView,
			rev: 27896,
			ms: 27896,
			n: 37,
			s: 5550022,
			i4ms: 33607,
			i4next: 17183,
			activesyncdisabled: false,
			webOfflineSyncDays: 0,
			recursive: false,
			deletable: true,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 2
		};

		setupTest(<DeleteModal onClose={(): void => closeModal()} folder={folder} />, {});

		expect(screen.getByText(/folder_panel\.modal\.delete\.body\.message1/i)).toBeInTheDocument();
		expect(screen.getByText(/folder_panel\.modal\.delete\.body\.message1/i)).toBeInTheDocument();

		const okButton = screen.getByRole('button', {
			name: /action\.ok/i
		});
		expect(okButton).toBeEnabled();

		const cancelButton = screen.getByRole('button', {
			name: /label\.cancel/i
		});
		expect(cancelButton).toBeEnabled();
	});
	test('delete the child folder of trash', async () => {
		const closeModal = vi.fn();

		const folder: Folder = {
			id: '109',
			uuid: faker.string.uuid(),
			name: 'Confluence',
			absFolderPath: '/Trash/Confluence',
			l: FOLDERS.TRASH,
			luuid: faker.string.uuid(),
			checked: false,
			f: 'u',
			u: 25,
			view: 'message' as FolderView,
			rev: 27896,
			ms: 27896,
			n: 37,
			s: 5550022,
			i4ms: 33607,
			i4next: 17183,
			activesyncdisabled: false,
			webOfflineSyncDays: 0,
			recursive: false,
			deletable: true,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 2
		};

		const { user } = setupTest(
			<DeleteModal onClose={(): void => closeModal()} folder={folder} />,
			{}
		);

		expect(screen.getByText(/folder_panel\.modal\.delete\.body\.message2/i)).toBeInTheDocument();
		expect(screen.getByText(/folder_panel\.modal\.delete\.body\.message4/i)).toBeInTheDocument();

		const okButton = screen.getByRole('button', {
			name: /action\.ok/i
		});
		expect(okButton).toBeEnabled();

		const cancelButton = screen.getByRole('button', {
			name: /label\.cancel/i
		});
		expect(cancelButton).toBeEnabled();

		await act(async () => {
			await user.click(cancelButton);
		});
	});

	test('API is called with the proper parameters to delete normal folder excepting trash', async () => {
		const closeModal = vi.fn();

		populateFoldersStore();
		const folder = getFolder(FOLDERS.INBOX);
		if (!folder) {
			return;
		}
		const { user } = setupTest(
			<DeleteModal onClose={(): void => closeModal()} folder={folder} />,
			{}
		);

		const okButton = screen.getByRole('button', {
			name: /action\.ok/i
		});
		expect(okButton).toBeEnabled();
		const wipeInterceptor = createSoapAPIInterceptor<{ action: SoapFolderAction }>('FolderAction');

		await act(async () => {
			await user.click(okButton);
		});

		const { action } = await wipeInterceptor;

		expect(action.id).toBe(FOLDERS.INBOX);
		expect(action.op).toBe(FOLDER_ACTIONS.MOVE);
	});

	test('API is called with the proper parameters to delete folder of trash', async () => {
		const closeModal = vi.fn();

		populateFoldersStore();
		const folder = getFolder(FOLDERS.TRASH);
		if (!folder) {
			return;
		}
		const { user } = setupTest(
			<DeleteModal onClose={(): void => closeModal()} folder={folder} />,
			{}
		);

		const okButton = screen.getByRole('button', {
			name: /action\.ok/i
		});
		expect(okButton).toBeEnabled();
		const wipeInterceptor = createSoapAPIInterceptor<{ action: SoapFolderAction }>('FolderAction');
		await act(async () => {
			await user.click(okButton);
		});
		const { action } = await wipeInterceptor;

		expect(action.id).toBe(FOLDERS.TRASH);
		expect(action.op).toBe(FOLDER_ACTIONS.DELETE);
	});

	test('API is called with the proper parameters to delete a folder in a shared account', async () => {
		const closeModal = vi.fn();

		populateFoldersStore();
		const folders = getFolders();
		const { children } = folders[1];
		const sharedAccountSecondFolder = children[1];
		if (!sharedAccountSecondFolder) {
			return;
		}
		const { user } = setupTest(
			<DeleteModal onClose={(): void => closeModal()} folder={sharedAccountSecondFolder} />,
			{}
		);

		const okButton = screen.getByRole('button', {
			name: /action\.ok/i
		});
		expect(okButton).toBeEnabled();
		const wipeInterceptor = createSoapAPIInterceptor<{ action: SoapFolderAction }>('FolderAction');

		await act(async () => {
			await user.click(okButton);
		});
		const { action } = await wipeInterceptor;

		expect(action.id).toBe(sharedAccountSecondFolder.id);
		expect(action.op).toBe(FOLDER_ACTIONS.TRASH);
	});
});
