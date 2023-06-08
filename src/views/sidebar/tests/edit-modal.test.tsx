/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { screen, within } from '@testing-library/react';
import { FOLDERS, ZIMBRA_STANDARD_COLORS, t } from '@zextras/carbonio-shell-ui';
import { faker } from '@faker-js/faker';
import { rest } from 'msw';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { Folder, FolderView } from '../../../carbonio-ui-commons/types/folder';
import { generateStore } from '../../../tests/generators/store';
import { EditModal } from '../edit-modal';
import { FolderAction } from '../../../types';
import { getSetupServer } from '../../../carbonio-ui-commons/test/jest-setup';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { getFolder } from '../../../carbonio-ui-commons/store/zustand/folder';

describe('edit-modal', () => {
	test('edit the folder excepting the system folders', async () => {
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
			n: 101,
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

		const { user } = setupTest(<EditModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

		expect(screen.getByText(/label\.folder_name/i)).toBeInTheDocument();
		expect(screen.getByText(/label\.folder_name/i)).toBeEnabled();

		const selectColor = screen.getByText(/label\.select_color/i);
		expect(selectColor).toBeInTheDocument();
		await user.click(selectColor);
		ZIMBRA_STANDARD_COLORS.forEach((el) => {
			within(screen.getByTestId('dropdown-popper-list')).getByText(`color.${el.zLabel}`);
		});
		const addShareButton = screen.getByRole('button', {
			name: /folder\.modal\.edit\.add_share/i
		});
		expect(addShareButton).toBeEnabled();

		const editButton = screen.getByRole('button', {
			name: /label\.edit/i
		});
		expect(editButton).toBeEnabled();
	});

	test('edit the system folder', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.datatype.uuid(),
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: FOLDERS.USER_ROOT,
			luuid: faker.datatype.uuid(),
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
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		};

		const { user } = setupTest(<EditModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

		expect(screen.getByText(/label\.folder_name/i)).toBeInTheDocument();

		const selectColor = screen.getByText(/label\.select_color/i);
		expect(selectColor).toBeInTheDocument();
		await user.click(selectColor);
		ZIMBRA_STANDARD_COLORS.forEach((el) => {
			within(screen.getByTestId('dropdown-popper-list')).getByText(`color.${el.zLabel}`);
		});
		const addShareButton = screen.getByRole('button', {
			name: /folder\.modal\.edit\.add_share/i
		});
		expect(addShareButton).toBeEnabled();

		const editButton = screen.getByRole('button', {
			name: /label\.edit/i
		});
		expect(editButton).toBeEnabled();
	});

	test('edit the folder with default retention policy is collapse', async () => {
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
			n: 101,
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

		setupTest(<EditModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

		expect(screen.getByText(/label\.folder_name/i)).toBeInTheDocument();
		expect(screen.getByText(/label\.folder_name/i)).toBeEnabled();
		const retentionPolicy = within(screen.getByTestId('retention_policy-icon')).getByTestId(
			'icon: ChevronDownOutline'
		);
		expect(retentionPolicy).toBeInTheDocument();
	});

	test('Enable message retention and enable message disposal are uncheck by default', async () => {
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
			n: 101,
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

		setupTest(<EditModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

		expect(screen.getByText(/label\.folder_name/i)).toBeInTheDocument();
		expect(screen.getByText(/label\.folder_name/i)).toBeEnabled();
		const retentionPolicy = within(screen.getByTestId('retention_policy-icon')).getByTestId(
			'icon: ChevronDownOutline'
		);
		expect(retentionPolicy).toBeInTheDocument();

		const enableMsgRetention = within(screen.getByTestId('enableMsgRetention')).getByTestId(
			'icon: Square'
		);
		expect(enableMsgRetention).toBeInTheDocument();
		const enableMsgDisposal = within(screen.getByTestId('enableMsgDisposal')).getByTestId(
			'icon: Square'
		);
		expect(enableMsgDisposal).toBeInTheDocument();
	});

	test('API is called with the proper parameters', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
		populateFoldersStore();
		const folder = getFolder(FOLDERS.TRASH);
		if (!folder) {
			return;
		}

		const { user } = setupTest(<EditModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

		const editButton = screen.getByRole('button', {
			name: /label\.edit/i
		});

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
		await user.click(editButton);
		const action = await wipeInterceptor;

		expect(action.id).toBe(FOLDERS.TRASH);
		expect(action.op).toBe('update');
		expect(action.color).toBe(folder?.color ?? 0);
		expect(action.name).toBe(folder.name);
	});

	test('edited folder name should be pass in parameter', async () => {
		const closeFn = jest.fn();
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
			n: 101,
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
		const { user } = setupTest(<EditModal onClose={closeFn} folder={folder} />, { store });

		expect(screen.getByTestId('folder-name')).toBeInTheDocument();
		const newFolder = screen.getByTestId('folder-name');
		const folderInputElement = within(newFolder).getByRole('textbox');

		expect(folderInputElement).toBeInTheDocument();
		await user.clear(folderInputElement);

		const editButton = screen.getByRole('button', {
			name: /label\.edit/i
		});
		expect(editButton).toBeEnabled();

		const folderName = faker.lorem.word();
		// update the existing folder name into the text input
		await user.type(folderInputElement, folderName);

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
		await user.click(editButton);
		const action = await wipeInterceptor;

		expect(action.id).toBe(folder.id);
		expect(action.op).toBe('update');
		expect(action.color).toBe(folder?.color ?? 0);
		expect(action.name).toBe(folderName);
	});
});
