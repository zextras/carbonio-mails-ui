/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import { t } from '@zextras/carbonio-shell-ui';

import { createAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { Folder, RootFolder } from '../../../carbonio-ui-commons/types/folder';
import { FOLDER_ACTIONS } from '../../../commons/utilities';
import { folderAction } from '../../../store/actions/folder-action';
import { generateStore } from '../../../tests/generators/store';
import { FolderAction, FolderActionResponse } from '../../../types';
import { SelectFolderModal } from '../select-folder-modal';

const folderToMove: Folder = {
	id: 'ce25dc9b-8be2-48ea-acb1-340f724f6352:1933',
	uuid: '0d9396ac-8521-4225-afd7-426ed214f757',
	name: 'Folder_to_move_to_root',
	absFolderPath: '/Inbox/Folder_to_move_to_root',
	l: 'ce25dc9b-8be2-48ea-acb1-340f724f6352:2',
	luuid: '7a9a31c8-7745-4395-9bdd-b8c5145b3610',
	checked: false,
	view: 'message',
	rev: 16942,
	ms: 16942,
	n: 0,
	s: 0,
	i4ms: 16942,
	i4next: 1934,
	activesyncdisabled: false,
	webOfflineSyncDays: 0,
	perm: 'rwidxac',
	recursive: false,
	deletable: true,
	isLink: false,
	children: [],
	parent: 'ce25dc9b-8be2-48ea-acb1-340f724f6352:2',
	depth: 2
};

const rootFolder = {
	id: 'ce25dc9b-8be2-48ea-acb1-340f724f6352:1',
	name: 'generic shared root folder',
	checked: false,
	activesyncdisabled: false,
	recursive: false,
	deletable: false,
	owner: faker.internet.email(),
	oname: 'USER_ROOT',
	reminder: false,
	broken: false,
	isLink: true,
	children: [
		{
			id: 'ce25dc9b-8be2-48ea-acb1-340f724f6352:2',
			uuid: '7a9a31c8-7745-4395-9bdd-b8c5145b3610',
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: 'ce25dc9b-8be2-48ea-acb1-340f724f6352:1',
			luuid: '854ff4c0-6a17-4ee8-9a59-bfb93ff3008a',
			checked: false,
			f: 'u',
			u: 1,
			view: 'message',
			rev: 1,
			ms: 1,
			n: 8,
			s: 17915,
			i4ms: 14693,
			i4next: 1906,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			perm: 'rwidxac',
			recursive: false,
			deletable: false,
			isLink: false,
			children: [folderToMove],
			parent: 'ce25dc9b-8be2-48ea-acb1-340f724f6352:1',
			depth: 1
		}
	],
	depth: 0
};

describe('move-modal', () => {
	test('folder selector is displaying correctly when root folder is selected', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
		const inputLabel = t(
			'folder_panel.modal.move.body.message1',
			'Select a folder to move the considered one to:'
		);

		const confirmAction = jest.fn();
		setupTest(
			<SelectFolderModal
				onClose={(): void => closeModal()}
				folder={rootFolder as RootFolder}
				headerTitle={`${t('label.move', 'Move')} ${folderToMove?.name}`}
				actionLabel={t('label.move', 'Move')}
				inputLabel={inputLabel}
				confirmAction={confirmAction}
				allowFolderCreation={false}
				showSharedAccounts
				showTrashFolder={false}
				showSpamFolder={false}
				allowRootSelection
			/>,
			{
				store
			}
		);

		expect(screen.getByText(/folder_panel\.modal\.move\.body\.message1/i)).toBeInTheDocument();

		const actionButton = screen.getByRole('button', {
			name: /label\.move/i
		});
		expect(actionButton).toBeEnabled();

		const cancelButton = screen.getByRole('button', {
			name: /label\.cancel/i
		});
		expect(cancelButton).toBeEnabled();
	});

	test('move a nested folder to the root folder', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
		const inputLabel = t(
			'folder_panel.modal.move.body.message1',
			'Select a folder to move the considered one to:'
		);

		const confirmAction = (): Promise<FolderActionResponse> =>
			folderAction({ folder: folderToMove, l: rootFolder.id, op: 'move' });

		setupTest(
			<SelectFolderModal
				onClose={(): void => closeModal()}
				folder={folderToMove}
				headerTitle={`${t('label.move', 'Move')} ${folderToMove?.name}`}
				actionLabel={t('label.move', 'Move')}
				inputLabel={inputLabel}
				confirmAction={confirmAction}
				allowFolderCreation={false}
				showSharedAccounts
				showTrashFolder={false}
				showSpamFolder={false}
				allowRootSelection
			/>,
			{
				store
			}
		);
	});
});

test('API is called with the proper parameters to move the selected folder into the root folder', async () => {
	const closeModal = jest.fn();
	const store = generateStore();
	populateFoldersStore();
	const confirmAction = (): Promise<FolderActionResponse> =>
		folderAction({ folder: folderToMove, l: rootFolder.id, op: 'move' });

	const { user } = setupTest(
		<SelectFolderModal
			onClose={(): void => closeModal()}
			folder={rootFolder as RootFolder}
			headerTitle={`${t('label.move', 'Move')} ${folderToMove?.name}`}
			actionLabel={t('label.move', 'Move')}
			inputLabel=""
			confirmAction={confirmAction}
			allowFolderCreation={false}
			showSharedAccounts
			showTrashFolder={false}
			showSpamFolder={false}
			allowRootSelection
		/>,
		{
			store
		}
	);
	const actionButton = screen.getByRole('button', {
		name: /label\.move/i
	});

	const folderActionInterceptor = createAPIInterceptor<FolderAction>('FolderAction', 'action');
	await user.click(actionButton);
	const action = await folderActionInterceptor;
	expect(action.id).toBe(folderToMove.id);
	expect(action.op).toBe(FOLDER_ACTIONS.MOVE);
	expect(action.l).toBe(rootFolder.id);
});
