/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { screen, renderHook, waitFor } from '@testing-library/react';
import { useModal } from '@zextras/carbonio-design-system';
import { t, useAppContext } from '@zextras/carbonio-shell-ui';

import { folderActionSoapApi } from '../../../api/folder-action-soap-api';
import { FolderActionsType, FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { generateFolder } from '../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { setMessagesInEmailStore } from '../../../store/emails/store';
import { populateMessagesInEmailStore } from '../../../tests/generators/generateMessage';
import { Folder } from '../../../types';
import { FolderActionsProps } from '../../../types/sidebar';
import { SelectFolderModal } from '../../../ui-actions/modals/select-folder-modal';
import { DeleteModal } from '../delete-modal';
import { EditModal } from '../edit-modal';
import { EmptyModal } from '../empty-modal';
import { NewModal } from '../new-modal';
import { SharesInfoModal } from '../shares-info-modal';
import { useFolderActions } from '../use-folder-actions';

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useModal: jest.fn()
}));

jest.mock('../delete-modal');
jest.mock('../edit-modal');
jest.mock('../empty-modal');
jest.mock('../new-modal');
jest.mock('../shares-info-modal');
jest.mock('../../../api/folder-action-soap-api');

const useAppContextMock = useAppContext as jest.Mock;

const folderActionSoapApiMock = folderActionSoapApi as jest.Mock;

const setCountMock = jest.fn();
useAppContextMock.mockReturnValue({
	setCount: setCountMock
});

const defaultFolder = generateFolder({ id: FOLDERS.INBOX });

async function setUpCreateModalTest(): Promise<{
	createModalSpy: jest.Mock;
	event: React.SyntheticEvent<HTMLElement>;
	actions: { current: Array<FolderActionsProps> };
}> {
	const createModalSpy = jest.fn();
	(useModal as jest.Mock).mockImplementation(() => ({
		createModal: createModalSpy
	}));
	const event = {
		stopPropagation: jest.fn
	} as unknown as React.SyntheticEvent<HTMLElement>;

	const messages = await waitFor(() =>
		populateMessagesInEmailStore({
			messageGeneratorParams: [{ id: '1', folderId: FOLDERS.INBOX }]
		})
	);
	await waitFor(() => setMessagesInEmailStore(messages, false));

	const { result: actions } = renderHook(() => useFolderActions(defaultFolder));
	return { createModalSpy, event, actions };
}

describe('useFolderActions', () => {
	it('should return the correct actions for the inbox folder', async () => {
		(useModal as jest.Mock).mockImplementation(() => ({
			createModal: jest.fn()
		}));

		const messages = await waitFor(() =>
			populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '1', folderId: FOLDERS.INBOX }]
			})
		);
		await waitFor(() => setMessagesInEmailStore(messages, false));

		const { result } = renderHook(() => useFolderActions(defaultFolder));

		expect(result.current).toEqual([
			{
				id: FolderActionsType.NEW,
				'data-testid': `folder-action-${FolderActionsType.NEW}`,
				icon: 'FolderAddOutline',
				label: t('label.new_folder', 'New Folder'),
				onClick: expect.any(Function),
				disabled: false,
				tooltipLabel: ''
			},
			{
				id: FolderActionsType.MOVE,
				'data-testid': `folder-action-${FolderActionsType.MOVE}`,
				disabled: true,
				icon: 'MoveOutline',
				label: t('label.move', 'Move'),
				onClick: expect.any(Function)
			},
			{
				id: FolderActionsType.EMPTY,
				'data-testid': `folder-action-${FolderActionsType.EMPTY}`,
				icon: 'EmptyFolderOutline',
				label: t('folder_panel.action.wipe.folder_panel', 'Wipe Folder'),
				disabled: true,
				onClick: expect.any(Function)
			},
			{
				id: FolderActionsType.EDIT,
				'data-testid': `folder-action-${FolderActionsType.EDIT}`,
				icon: 'Edit2Outline',
				label: t('label.edit', 'Edit'),
				onClick: expect.any(Function)
			},
			{
				id: FolderActionsType.DELETE,
				'data-testid': `folder-action-${FolderActionsType.DELETE}`,
				disabled: true,
				icon: 'Trash2Outline',
				label: t('label.delete', 'Delete'),
				onClick: expect.any(Function)
			},
			{
				'data-testid': 'folder-action-read',
				icon: 'EmailReadOutline',
				id: 'read',
				label: 'label.mark_all_as_read',
				onClick: expect.any(Function)
			}
		]);
	});

	it('should return the correct actions for a shared folder', async () => {
		(useModal as jest.Mock).mockImplementation(() => ({
			createModal: jest.fn()
		}));

		const messages = await waitFor(() =>
			populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '1', folderId: FOLDERS.INBOX }]
			})
		);
		await waitFor(() => setMessagesInEmailStore(messages, false));

		const folder = {
			...defaultFolder,
			id: 'shared:1',
			isLink: true
		} as Folder;

		const { result } = renderHook(() => useFolderActions(folder));
		expect(result.current).toEqual([
			{
				id: FolderActionsType.EDIT,
				'data-testid': `folder-action-${FolderActionsType.EDIT}`,
				icon: 'Edit2Outline',
				label: t('folder_panel.action.edit_properties', 'Edit Properties'),
				onClick: expect.any(Function)
			},
			{
				id: FolderActionsType.REMOVE_FROM_LIST,
				'data-testid': `folder-action-${FolderActionsType.REMOVE_FROM_LIST}`,
				icon: 'CloseOutline',
				label: t('label.remove_from_this_list', 'Remove from this list'),
				onClick: expect.any(Function)
			},
			{
				id: FolderActionsType.SHARES_INFO,
				'data-testid': `folder-action-${FolderActionsType.SHARES_INFO}`,
				icon: 'InfoOutline',
				label: t('label.shares_info', `Shared folder's info`),
				onClick: expect.any(Function)
			}
		]);
	});

	it('should disable the new action if the user does not have permission', async () => {
		(useModal as jest.Mock).mockImplementation(() => ({
			createModal: jest.fn()
		}));

		const folderWithReadPermissionsOnly = { ...defaultFolder, perm: 'r' };
		const messages = await waitFor(() =>
			populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '1', folderId: FOLDERS.INBOX }]
			})
		);
		await waitFor(() => setMessagesInEmailStore(messages, false));

		const { result } = renderHook(() => useFolderActions(folderWithReadPermissionsOnly));
		expect(result.current[0].disabled).toBe(true);
	});

	it('should call the createModal function with the correct parameters when the NEW action is clicked', async () => {
		const { createModalSpy, event, actions } = await setUpCreateModalTest();
		const newAction = actions.current.find(
			(action) => action.id === FolderActionsType.NEW
		) as FolderActionsProps;

		act(() => {
			newAction.onClick(event);
		});

		expect(createModalSpy).toHaveBeenCalledTimes(1);
		const modal = <NewModal folder={defaultFolder} onClose={expect.any(Function)} />;
		setupTest(createModalSpy.mock.calls[0][0].children);
		expect(screen.getByText('New Folder')).toBeInTheDocument();
		expect(createModalSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				maxHeight: '90vh',
				size: 'medium',
				children: modal
			}),
			true
		);
	});

	it('should call the createModal function with the correct parameters when the MOVE action is clicked', async () => {
		const { createModalSpy, event, actions } = await setUpCreateModalTest();
		const moveAction = actions.current.find(
			(action) => action.id === FolderActionsType.MOVE
		) as FolderActionsProps;

		act(() => {
			moveAction.onClick(event);
		});

		expect(createModalSpy).toHaveBeenCalledTimes(1);
		const modal = (
			<SelectFolderModal
				folder={defaultFolder}
				onClose={expect.any(Function)}
				headerTitle={expect.any(String)}
				actionLabel={expect.any(String)}
				inputLabel={expect.any(String)}
				confirmAction={expect.any(Function)}
				allowFolderCreation={expect.any(Boolean)}
				allowRootSelection={expect.any(Boolean)}
				showSharedAccounts={expect.any(Boolean)}
				showTrashFolder={expect.any(Boolean)}
				showSpamFolder={expect.any(Boolean)}
			/>
		);

		expect(createModalSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				maxHeight: '90vh',
				size: 'medium',
				children: modal
			}),
			true
		);
	});

	it('should call the createModal function with the correct parameters when the EMPTY action is clicked', async () => {
		const { createModalSpy, event, actions } = await setUpCreateModalTest();
		const emptyAction = actions.current.find(
			(action) => action.id === FolderActionsType.EMPTY
		) as FolderActionsProps;

		act(() => {
			emptyAction.onClick(event);
		});

		expect(createModalSpy).toHaveBeenCalledTimes(1);
		const modal = <EmptyModal folder={defaultFolder} onClose={expect.any(Function)} />;

		expect(createModalSpy).toHaveBeenCalledWith(
			{
				id: expect.any(String),
				children: modal
			},
			true
		);
	});

	it('should call the createModal function with the correct parameters when the EDIT action is clicked', async () => {
		const { createModalSpy, event, actions } = await setUpCreateModalTest();
		const editAction = actions.current.find(
			(action) => action.id === FolderActionsType.EDIT
		) as FolderActionsProps;

		act(() => {
			editAction.onClick(event);
		});

		expect(createModalSpy).toHaveBeenCalledTimes(1);
		const modal = <EditModal folder={defaultFolder} onClose={expect.any(Function)} />;

		expect(createModalSpy).toHaveBeenCalledWith(
			{
				id: expect.any(String),
				maxHeight: '90vh',
				children: modal
			},
			true
		);
	});

	it('should call the createModal function with the correct parameters when the DELETE action is clicked', async () => {
		const { createModalSpy, event, actions } = await setUpCreateModalTest();
		const deleteAction = actions.current.find(
			(action) => action.id === FolderActionsType.DELETE
		) as FolderActionsProps;

		act(() => {
			deleteAction.onClick(event);
		});

		expect(createModalSpy).toHaveBeenCalledTimes(1);
		const modal = <DeleteModal folder={defaultFolder} onClose={expect.any(Function)} />;

		expect(createModalSpy).toHaveBeenCalledWith(
			{
				id: expect.any(String),
				children: modal
			},
			true
		);
	});

	it('should call the folderActionSoapApi function when the REMOVE_FROM_LIST action is clicked', async () => {
		(folderActionSoapApiMock as jest.Mock).mockImplementation(jest.fn());
		(useModal as jest.Mock).mockImplementation(() => ({
			createModal: jest.fn()
		}));

		const folder = {
			...defaultFolder,
			id: 'shared:66',
			isLink: true
		} as Folder;

		const event = {
			stopPropagation: jest.fn
		} as unknown as React.SyntheticEvent<HTMLElement>;

		const messages = await waitFor(() =>
			populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '1', folderId: folder.id }]
			})
		);
		await waitFor(() => setMessagesInEmailStore(messages, false));

		const { result: actions } = renderHook(() => useFolderActions(folder));

		const removeAction = actions.current.find(
			(action) => action.id === FolderActionsType.REMOVE_FROM_LIST
		) as FolderActionsProps;

		act(() => {
			removeAction.onClick(event);
		});

		expect(folderActionSoapApiMock).toHaveBeenCalledTimes(1);
		expect(folderActionSoapApiMock).toHaveBeenCalledWith({
			folder,
			op: 'delete'
		});
	});

	it('should call the createModal function with the correct parameters when the SHARES_INFO action is clicked', () => {
		const createModalSpy = jest.fn();
		(useModal as jest.Mock).mockImplementation(() => ({
			createModal: createModalSpy
		}));

		const event = {
			stopPropagation: jest.fn
		} as unknown as React.SyntheticEvent<HTMLElement>;

		const folder = {
			...defaultFolder,
			id: 'shared:66',
			isLink: true
		} as Folder;

		const { result: actions } = renderHook(() => useFolderActions(folder));

		const sharesInfoAction = actions.current.find(
			(action) => action.id === FolderActionsType.SHARES_INFO
		) as FolderActionsProps;

		act(() => {
			sharesInfoAction.onClick(event);
		});

		expect(createModalSpy).toHaveBeenCalledTimes(1);
		const modal = <SharesInfoModal folder={folder} onClose={expect.any(Function)} />;

		expect(createModalSpy).toHaveBeenCalledWith(
			{
				id: expect.any(String),
				children: modal
			},
			true
		);
	});

	it('should call the folderActionSoapApi function when the MARK_ALL_READ action is clicked', () => {
		(folderActionSoapApiMock as jest.Mock).mockImplementation(jest.fn());
		(useModal as jest.Mock).mockImplementation(() => ({
			createModal: jest.fn()
		}));

		const event = {
			stopPropagation: jest.fn
		} as unknown as React.SyntheticEvent<HTMLElement>;

		const { result: actions } = renderHook(() => useFolderActions(defaultFolder));

		const markAllReadAction = actions.current.find(
			(action) => action.id === FolderActionsType.MARK_ALL_READ
		) as FolderActionsProps;

		act(() => {
			markAllReadAction.onClick(event);
		});

		expect(folderActionSoapApiMock).toHaveBeenCalledTimes(1);
		expect(folderActionSoapApiMock).toHaveBeenCalledWith({
			folder: defaultFolder,
			op: 'read',
			l: defaultFolder.id
		});
	});

	it('should disable the move and delete actions for the inbox and sent folders', () => {
		(useModal as jest.Mock).mockImplementation(() => ({
			createModal: jest.fn()
		}));
		const folders = [FOLDERS.INBOX, FOLDERS.SENT];
		folders.forEach(async (folderId) => {
			const messages = await waitFor(() =>
				populateMessagesInEmailStore({
					messageGeneratorParams: [{ id: '1', folderId }]
				})
			);
			await waitFor(() => setMessagesInEmailStore(messages, false));

			const { result: actions } = renderHook(() => useFolderActions(defaultFolder));

			const moveAction = actions.current.find(
				(action) => action.id === FolderActionsType.MOVE
			) as FolderActionsProps;
			const deleteAction = actions.current.find(
				(action) => action.id === FolderActionsType.DELETE
			) as FolderActionsProps;

			expect(moveAction.disabled).toBe(true);
			expect(deleteAction.disabled).toBe(true);
		});
	});

	it('should disable the move, delete and mark all read actions for the drafts folder', async () => {
		(useModal as jest.Mock).mockImplementation(() => ({
			createModal: jest.fn()
		}));

		const messages = populateMessagesInEmailStore({
			messageGeneratorParams: [{ id: '1', folderId: FOLDERS.DRAFTS, isRead: false }]
		});
		await act(async () => {
			setMessagesInEmailStore(messages, false);
		});
		const folder = {
			...defaultFolder,
			id: FOLDERS.DRAFTS
		} as Folder;

		const { result: actions } = renderHook(() => useFolderActions(folder));

		const moveAction = actions.current.find(
			(action) => action.id === FolderActionsType.MOVE
		) as FolderActionsProps;
		const deleteAction = actions.current.find(
			(action) => action.id === FolderActionsType.DELETE
		) as FolderActionsProps;
		const markAllReadAction = actions.current.find(
			(action) => action.id === FolderActionsType.MARK_ALL_READ
		) as FolderActionsProps;

		expect(moveAction.disabled).toBe(true);
		expect(deleteAction.disabled).toBe(true);
		expect(markAllReadAction.disabled).toBe(true);
	});

	it('should disable the new, move and delete actions for the spam folder', async () => {
		(useModal as jest.Mock).mockImplementation(() => ({
			createModal: jest.fn()
		}));

		const messages = populateMessagesInEmailStore({
			messageGeneratorParams: [{ id: '1', folderId: FOLDERS.SPAM }]
		});

		await act(async () => {
			setMessagesInEmailStore(messages, false);
		});
		const folder = {
			...defaultFolder,
			id: FOLDERS.SPAM
		} as Folder;

		const { result: actions } = renderHook(() => useFolderActions(folder));

		const newAction = actions.current.find(
			(action) => action.id === FolderActionsType.NEW
		) as FolderActionsProps;
		const moveAction = actions.current.find(
			(action) => action.id === FolderActionsType.MOVE
		) as FolderActionsProps;
		const deleteAction = actions.current.find(
			(action) => action.id === FolderActionsType.DELETE
		) as FolderActionsProps;

		expect(newAction.disabled).toBe(true);
		expect(moveAction.disabled).toBe(true);
		expect(deleteAction.disabled).toBe(true);
	});

	it('should disable the move, delete and edit actions for the trash folder', async () => {
		(useModal as jest.Mock).mockImplementation(() => ({
			createModal: jest.fn()
		}));

		const messages = populateMessagesInEmailStore({
			messageGeneratorParams: [{ id: '1', folderId: FOLDERS.TRASH }]
		});

		await act(async () => {
			setMessagesInEmailStore(messages, false);
		});

		const folder = {
			...defaultFolder,
			id: FOLDERS.TRASH
		} as Folder;

		const { result: actions } = renderHook(() => useFolderActions(folder));

		const moveAction = actions.current.find(
			(action) => action.id === FolderActionsType.MOVE
		) as FolderActionsProps;
		const deleteAction = actions.current.find(
			(action) => action.id === FolderActionsType.DELETE
		) as FolderActionsProps;
		const editAction = actions.current.find(
			(action) => action.id === FolderActionsType.EDIT
		) as FolderActionsProps;

		expect(moveAction.disabled).toBe(true);
		expect(deleteAction.disabled).toBe(true);
		expect(editAction.disabled).toBe(true);
	});

	it('should disable the new and edit actions for folders inside the trash folder', async () => {
		(useModal as jest.Mock).mockImplementation(() => ({
			createModal: jest.fn()
		}));

		const subFolder = generateFolder({ absFolderPath: '/Trash', id: '23476283478' });

		const { result: actions } = renderHook(() => useFolderActions(subFolder));

		const newAction = actions.current.find(
			(action) => action.id === FolderActionsType.NEW
		) as FolderActionsProps;
		const editAction = actions.current.find(
			(action) => action.id === FolderActionsType.EDIT
		) as FolderActionsProps;

		expect(newAction.disabled).toBe(true);
		expect(editAction.disabled).toBe(true);
	});
});
