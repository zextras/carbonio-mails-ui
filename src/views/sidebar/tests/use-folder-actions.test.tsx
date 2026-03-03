/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { renderHook, screen, waitFor, within } from '@testing-library/react';
import { t, useAppContext } from '@zextras/carbonio-shell-ui';
import { FOLDERS, FolderActionsType, Folder } from '@zextras/carbonio-ui-commons';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { folderActionSoapApi } from 'api/folder-action-soap-api';
import { setMessagesInEmailStore } from 'store/emails/store';
import { FolderActionsProps } from 'types/sidebar';
import { useFolderActions } from 'views/sidebar/use-folder-actions';

vi.mock('../../../api/folder-action-soap-api');

const useAppContextMock = useAppContext as Mock;

const folderActionSoapApiMock = folderActionSoapApi as Mock;

const setCountMock = vi.fn();
useAppContextMock.mockReturnValue({
	setCount: setCountMock
});

const defaultFolder = generateFolder({ id: FOLDERS.INBOX });

const OpenFolderModalComponent = (): React.JSX.Element => {
	const actions = useFolderActions(defaultFolder);
	const newAction = actions.find(
		(action) => action.id === FolderActionsType.NEW
	) as FolderActionsProps;
	const deleteAction = actions.find(
		(action) => action.id === FolderActionsType.DELETE
	) as FolderActionsProps;
	const editAction = actions.find(
		(action) => action.id === FolderActionsType.EDIT
	) as FolderActionsProps;
	const emptyAction = actions.find(
		(action) => action.id === FolderActionsType.EMPTY
	) as FolderActionsProps;
	const moveAction = actions.find(
		(action) => action.id === FolderActionsType.MOVE
	) as FolderActionsProps;
	return (
		<>
			<button data-testid={'newFolder'} onClick={newAction.onClick}>
				New folder
			</button>
			<button data-testid={'deleteFolder'} onClick={deleteAction.onClick}>
				Delete folder
			</button>
			<button data-testid={'editFolder'} onClick={editAction.onClick}>
				Edit folder
			</button>
			<button data-testid={'emptyFolder'} onClick={emptyAction.onClick}>
				Empty folder
			</button>
			<button data-testid={'moveFolder'} onClick={moveAction.onClick}>
				Move folder
			</button>
		</>
	);
};

async function setUpCreateModalTest(): Promise<void> {
	const messages = await waitFor(() =>
		populateMessagesInEmailStore({
			messageGeneratorParams: [{ id: '1', folderId: FOLDERS.INBOX }]
		})
	);
	await waitFor(() => setMessagesInEmailStore(messages, false));
}

describe('useFolderActions', () => {
	it('should return the correct actions for the inbox folder', async () => {
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
				label: t('folder_panel.action.empty.folder_panel', 'Empty Folder'),
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
		await setUpCreateModalTest();
		const { user } = setupTest(<OpenFolderModalComponent />);
		const button = await screen.findByTestId('newFolder');
		await user.click(button);

		expect(await screen.findByText('folder_panel.modal.new.title')).toBeVisible();
	});

	it('should call the createModal function with the correct parameters when the MOVE action is clicked', async () => {
		await setUpCreateModalTest();
		const { user } = setupTest(<OpenFolderModalComponent />);
		const button = await screen.findByTestId('moveFolder');
		await user.click(button);

		expect(await screen.findByText('label.move')).toBeVisible();
	});

	it('should call the createModal function with the correct parameters when the EMPTY action is clicked', async () => {
		const { user } = setupTest(<OpenFolderModalComponent />);
		const button = await screen.findByTestId('emptyFolder');
		await user.click(button);

		const modal = await screen.findByTestId('modal');

		expect(within(modal).getByText(/label\.empty: /i)).toBeVisible();
	});

	it('should call the createModal function with the correct parameters when the EDIT action is clicked', async () => {
		createSoapAPIInterceptor('GetFolder');
		const { user } = setupTest(<OpenFolderModalComponent />);
		const button = await screen.findByTestId('editFolder');

		await user.click(button);

		expect(await screen.findByText('label.edit_folder_properties')).toBeVisible();
	});

	it.skip('should call the createModal function with the correct parameters when the DELETE action is clicked', async () => {
		const { user } = setupTest(<OpenFolderModalComponent />);
		const button = await screen.findByTestId('deleteFolder');

		await user.click(button);

		expect(await screen.findByText('label.delete')).toBeVisible();
	});

	it('should call the folderActionSoapApi function when the REMOVE_FROM_LIST action is clicked', async () => {
		(folderActionSoapApiMock as Mock).mockImplementation(vi.fn());

		const folder = {
			...defaultFolder,
			id: 'shared:66',
			isLink: true
		} as Folder;

		const event = {
			stopPropagation: vi.fn
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

	it.skip('should call the createModal function with the correct parameters when the SHARES_INFO action is clicked', async () => {
		const event = {
			stopPropagation: vi.fn
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

		expect(await screen.findByText("Shared folder's info")).toBeInTheDocument();
	});

	it('should call the folderActionSoapApi function when the MARK_ALL_READ action is clicked', () => {
		(folderActionSoapApiMock as Mock).mockImplementation(vi.fn());

		const event = {
			stopPropagation: vi.fn
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

	it('should disable the  move, delete and edit actions for the archive folder', async () => {
		const folder = {
			...defaultFolder,
			id: FOLDERS.ARCHIVE
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
});
