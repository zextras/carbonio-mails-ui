/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { faker } from '@faker-js/faker';
import { rest } from 'msw';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { Folder, FolderView } from '../../../carbonio-ui-commons/types/folder';
import { generateStore } from '../../../tests/generators/store';
import { DeleteModal } from '../delete-modal';
import { FolderAction } from '../../../types';
import { getSetupServer } from '../../../carbonio-ui-commons/test/jest-setup';
import { getFolder } from '../../../carbonio-ui-commons/store/zustand/folder';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';

describe('delete-modal', () => {
	test('delete the folder except the child of trash folder', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
		const folder: Folder = {
			id: '106',
			uuid: faker.datatype.uuid(),
			name: 'Confluence',
			absFolderPath: '/Inbox/Confluence',
			l: FOLDERS.INBOX,
			luuid: faker.datatype.uuid(),
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

		setupTest(<DeleteModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

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
		const closeModal = jest.fn();
		const store = generateStore();
		const folder: Folder = {
			id: '109',
			uuid: faker.datatype.uuid(),
			name: 'Confluence',
			absFolderPath: '/Trash/Confluence',
			l: FOLDERS.TRASH,
			luuid: faker.datatype.uuid(),
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

		const { user } = setupTest(<DeleteModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

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
		await user.click(cancelButton);
	});

	test('API is called with the proper parameters to delete normal folder excepting trash', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
		populateFoldersStore();
		const folder = getFolder(FOLDERS.INBOX);
		if (!folder) {
			return;
		}
		const { user } = setupTest(<DeleteModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

		const okButton = screen.getByRole('button', {
			name: /action\.ok/i
		});
		expect(okButton).toBeEnabled();

		const wipeInterceptor = new Promise<FolderAction>((resolve, reject) => {
			// Register a handler for the REST call
			getSetupServer().use(
				rest.post('/service/soap/FolderActionRequest', async (req, res, ctx) => {
					if (!req) {
						reject(new Error('Empty request'));
					}

					const msg = (await req.json()).Body.FolderActionRequest.action;
					resolve(msg);

					// Don't care about the actual response
					return res(
						ctx.json({
							Body: {
								Fault: {}
							}
						})
					);
				})
			);
		});
		await user.click(okButton);
		const action = await wipeInterceptor;

		expect(action.id).toBe(FOLDERS.INBOX);
		expect(action.op).toBe('move');
	});

	test('API is called with the proper parameters to delete folder of trash', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
		populateFoldersStore();
		const folder = getFolder(FOLDERS.TRASH);
		if (!folder) {
			return;
		}
		const { user } = setupTest(<DeleteModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

		const okButton = screen.getByRole('button', {
			name: /action\.ok/i
		});
		expect(okButton).toBeEnabled();

		const wipeInterceptor = new Promise<FolderAction>((resolve, reject) => {
			// Register a handler for the REST call
			getSetupServer().use(
				rest.post('/service/soap/FolderActionRequest', async (req, res, ctx) => {
					if (!req) {
						reject(new Error('Empty request'));
					}

					const msg = (await req.json()).Body.FolderActionRequest.action;
					resolve(msg);

					// Don't care about the actual response
					return res(
						ctx.json({
							Body: {
								Fault: {}
							}
						})
					);
				})
			);
		});
		await user.click(okButton);
		const action = await wipeInterceptor;

		expect(action.id).toBe(FOLDERS.TRASH);
		expect(action.op).toBe('delete');
	});
});
