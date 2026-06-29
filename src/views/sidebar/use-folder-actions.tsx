/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { SyntheticEvent, useMemo } from 'react';

import { useModal } from '@zextras/carbonio-design-system';
import { t, useUserAccount } from '@zextras/carbonio-shell-ui';
import {
	Folder,
	FOLDERS,
	FolderActionsType,
	allowedActionOnSharedAccount
} from '@zextras/carbonio-ui-commons';
import { noop, startsWith } from 'lodash';

import { folderActionSoapApi } from 'api/folder-action-soap-api';
import { getFolderIdParts } from 'helpers/folders';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { useMessagesByFolder } from 'store/emails/store';
import { SelectFolderModal } from 'ui-actions/modals/select-folder-modal';
import { MoveMessage } from 'ui-actions/move-msg';
import { getLocationOrigin } from 'views/app/detail-panel/preview/utils';
import { DeleteModal } from 'views/sidebar/delete-modal';
import { EditModal } from 'views/sidebar/edit-modal';
import { EmptyModal } from 'views/sidebar/empty-modal';
import { ExportArchiveModal, ExportFormat } from 'views/sidebar/export-archive-modal';
import { ImportArchiveModal } from 'views/sidebar/import-archive-modal';
import { NewModal } from 'views/sidebar/new-modal';
import { SharesInfoModal } from 'views/sidebar/shares-info-modal';

type FolderActionsProps = {
	id: string;
	icon?: string;
	label: string;
	onClick?: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void;
	disabled?: boolean;
	items?: Array<FolderActionsProps>;
};

const IMPORT_ARCHIVE_SNACKBAR_KEY = 'import-archive';

function getFileImportParams(file: File): { fmt: string; contentType: string } {
	if (file.name.endsWith('.mbox')) {
		return { fmt: 'mbox', contentType: 'application/mbox' };
	}
	if (file.name.endsWith('.zip')) {
		return { fmt: 'zip', contentType: 'application/zip' };
	}
	return { fmt: 'tgz', contentType: 'application/x-compressed-tar' };
}

async function performFolderMove(
	folder: Folder,
	createSnackbar: ReturnType<typeof useUiUtilities>['createSnackbar'],
	folderDestination: Folder | undefined,
	setFolderDestination: (_folder: Folder | undefined) => void,
	onClose: () => void
): Promise<void> {
	const restoreFolder = async (): Promise<void> => {
		const res = await folderActionSoapApi({ folder, l: folder.l, op: 'move' });
		if (!('Fault' in res)) {
			createSnackbar({
				key: 'move-folder',
				replace: true,
				severity: 'success',
				label: t('messages.snackbar.folder_restored', 'Folder restored'),
				autoHideTimeout: 3000,
				hideButton: true
			});
		} else {
			createSnackbar({
				key: 'move',
				replace: true,
				severity: 'error',
				label: t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: 3000,
				hideButton: true
			});
		}
	};

	const res = await folderActionSoapApi({
		folder,
		l: folderDestination?.id ?? FOLDERS.USER_ROOT,
		op: 'move'
	});

	if (!('Fault' in res)) {
		createSnackbar({
			key: 'move',
			replace: true,
			severity: 'success',
			label: t('messages.snackbar.folder_moved', 'Folder successfully moved'),
			autoHideTimeout: 5000,
			hideButton: false,
			actionLabel: t('label.undo', 'Undo'),
			onActionClick: () => restoreFolder()
		});
	} else {
		createSnackbar({
			key: 'move',
			replace: true,
			severity: 'error',
			label: t('label.error_try_again', 'Something went wrong, please try again.'),
			autoHideTimeout: 3000
		});
	}
	setFolderDestination(undefined);
	onClose();
}

function triggerFileDownload(url: string): void {
	const link = document.createElement('a');
	link.href = url;
	document.body.appendChild(link);
	link.click();
	link.remove();
}

export function buildImportArchiveOnClick({
	folder,
	name,
	createModal,
	closeModal,
	createSnackbar
}: {
	folder: Folder;
	name: string;
	createModal: ReturnType<typeof useModal>['createModal'];
	closeModal: ReturnType<typeof useModal>['closeModal'];
	createSnackbar: ReturnType<typeof useUiUtilities>['createSnackbar'];
}): (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void {
	return (e) => {
		if (e) {
			e.stopPropagation();
		}
		const user = folder.isLink ? (folder.owner ?? name) : name;
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.tgz,.mbox,.zip';
		input.onchange = (): void => {
			const file = input.files?.[0];
			if (!file) {
				input.remove();
				return;
			}

			const { fmt, contentType } = getFileImportParams(file);

			const modalId = Date.now().toString();
			const startImport = async (): Promise<void> => {
				closeModal(modalId);
				createSnackbar({
					key: IMPORT_ARCHIVE_SNACKBAR_KEY,
					replace: true,
					severity: 'info',
					label: t(
						'messages.snackbar.import_archive_started',
						"{{filename}} import has started. You will be notified when it's ready",
						{ filename: file.name }
					),
					disableAutoHide: false,
					hideButton: true
				});
				try {
					const response = await fetch(
						`${getLocationOrigin()}/service/home/${user}${folder.absFolderPath}?fmt=${fmt}&auth=co`,
						{
							method: 'POST',
							body: file,
							headers: { 'Content-Type': contentType }
						}
					);
					createSnackbar({
						key: IMPORT_ARCHIVE_SNACKBAR_KEY,
						replace: true,
						severity: response.ok ? 'success' : 'error',
						label: response.ok
							? t(
									'messages.snackbar.import_archive_success',
									'{{filename}} imported successfully',
									{ filename: file.name }
								)
							: t(
									'messages.snackbar.import_archive_error',
									'{{filename}} imported failed. Please try again or contact your administrator',
									{ filename: file.name }
								),
						disableAutoHide: true,
						actionLabel: t('label.dismiss', 'Dismiss')
					});
				} catch {
					createSnackbar({
						key: IMPORT_ARCHIVE_SNACKBAR_KEY,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				} finally {
					input.remove();
				}
			};

			createModal({
				id: modalId,
				maxHeight: '90vh',
				title: t('modal.import.title', 'Ready to import?'),
				onClose: (): void => {
					closeModal(modalId);
					input.remove();
				},
				dismissLabel: t('label.cancel', 'Cancel'),
				onConfirm: startImport,
				confirmLabel: t('label.import', 'Import'),
				children: <ImportArchiveModal folder={folder} file={file} />
			});
		};
		document.body.appendChild(input);
		input.click();
	};
}

export function buildExportArchiveOnClick({
	folder,
	name,
	createModal,
	closeModal
}: {
	folder: Folder;
	name: string;
	createModal: ReturnType<typeof useModal>['createModal'];
	closeModal: ReturnType<typeof useModal>['closeModal'];
}): (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void {
	return (e) => {
		if (e) {
			e.stopPropagation();
		}

		let selectedFormat: ExportFormat = 'tgz';
		const modalId = Date.now().toString();

		createModal({
			id: modalId,
			size: 'large',
			title: t('modal.export.title', 'Ready to export?'),
			onClose: (): void => {
				closeModal(modalId);
			},
			dismissLabel: t('label.cancel', 'Cancel'),
			confirmLabel: t('label.export', 'Export'),
			onConfirm: (): void => {
				const user = folder.isLink ? (folder.owner ?? name) : name;
				const safeName = folder.name.replaceAll(' ', '-');
				const url =
					selectedFormat === 'tgz'
						? `${getLocationOrigin()}/service/home/${user}/?auth=co&fmt=tgz&types=message,conversation&id=${folder.id}&filename=archive-${safeName}.tgz`
						: `${getLocationOrigin()}/service/home/${user}/?auth=co&fmt=zip&types=message,conversation&id=${folder.id}&filename=archive-${safeName}.zip`;
				triggerFileDownload(url);
				closeModal(modalId);
			},
			children: (
				<ExportArchiveModal
					folder={folder}
					onFormatChange={(fmt): void => {
						selectedFormat = fmt;
					}}
				/>
			)
		});
	};
}

export const useFolderActions = (folder: Folder): Array<FolderActionsProps> => {
	const { createModal, closeModal } = useModal();
	const { name } = useUserAccount();
	const folderIsTrash = getFolderIdParts(folder.id ?? '0').id === FOLDERS.TRASH;
	const messagesInFolder = useMessagesByFolder(folder.id);

	const trashMessages = messagesInFolder
		.filter(() => getFolderIdParts(folder.id).id === FOLDERS.TRASH)
		.map((message) => message.id);

	const { createSnackbar } = useUiUtilities();

	const actions = useMemo(
		() => [
			{
				id: FolderActionsType.NEW,
				'data-testid': `folder-action-${FolderActionsType.NEW}`,
				icon: 'FolderAddOutline',
				label: t('label.new_folder', 'New Folder'),
				onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const modalId = Date.now().toString();
					createModal(
						{
							id: modalId,
							maxHeight: '90vh',
							size: 'medium',
							onClose: (): void => {
								closeModal(modalId);
							},
							focusModalContent: false,
							children: <NewModal folder={folder} onClose={(): void => closeModal(modalId)} />
						},
						true
					);
				},
				tooltipLabel: !allowedActionOnSharedAccount(folder, FolderActionsType.NEW)
					? t('label.do_not_have_perm', `You don't have permission`)
					: '',
				disabled: !allowedActionOnSharedAccount(folder, FolderActionsType.NEW)
			},
			{
				id: FolderActionsType.MOVE,
				'data-testid': `folder-action-${FolderActionsType.MOVE}`,
				icon: folderIsTrash ? 'RestoreOutline' : 'MoveOutline',
				label: folderIsTrash ? t('label.restore', 'Restore') : t('label.move', 'Move'),
				onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}

					if (folderIsTrash) {
						const modalId = Date.now().toString();
						createModal(
							{
								id: modalId,
								maxHeight: '90vh',
								size: 'medium',
								onClose: (): void => {
									closeModal(modalId);
								},
								children: (
									<MoveMessage
										folderId={folder.id}
										selectedIDs={trashMessages}
										onClose={(): void => closeModal(modalId)}
										isRestore
									/>
								)
							},
							true
						);
					} else {
						const inputLabel = t(
							'folder_panel.modal.move.body.message1',
							'Select a folder to move the considered one to:'
						);
						const confirmAction = (
							folderDestination: Folder | undefined,
							setFolderDestination: (_folder: Folder | undefined) => void,
							onClose: () => void
						): void => {
							const restoreFolder = (): Promise<void> =>
								folderActionSoapApi({ folder, l: folder.l, op: 'move' }).then((res) => {
									if (!('Fault' in res)) {
										createSnackbar({
											key: `move-folder`,
											replace: true,
											severity: 'success',
											label: t('messages.snackbar.folder_restored', 'Folder restored'),
											autoHideTimeout: 3000,
											hideButton: true
										});
									} else {
										createSnackbar({
											key: `move`,
											replace: true,
											severity: 'error',
											label: t('label.error_try_again', 'Something went wrong, please try again'),
											autoHideTimeout: 3000,
											hideButton: true
										});
									}
								});
							folderActionSoapApi({
								folder,
								l: folderDestination?.id ?? FOLDERS.USER_ROOT,
								op: 'move'
							})
								.then((res) => {
									if (!('Fault' in res)) {
										createSnackbar({
											key: `move`,
											replace: true,
											severity: 'success',
											label: t('messages.snackbar.folder_moved', 'Folder successfully moved'),
											autoHideTimeout: 5000,
											hideButton: false,
											actionLabel: t('label.undo', 'Undo'),
											onActionClick: () => restoreFolder()
										});
									} else {
										createSnackbar({
											key: `move`,
											replace: true,
											severity: 'error',
											label: t('label.error_try_again', 'Something went wrong, please try again.'),
											autoHideTimeout: 3000
										});
									}
									setFolderDestination(undefined);
									onClose();
								})
								.catch(() => noop);
						};
						const modalId = Date.now().toString();
						createModal(
							{
								id: modalId,
								maxHeight: '90vh',
								size: 'medium',
								onClose: (): void => {
									closeModal(modalId);
								},
								children: (
									<SelectFolderModal
										folder={folder}
										onClose={(): void => closeModal(modalId)}
										headerTitle={`${t('label.move', 'Move')} ${folder?.name}`}
										actionLabel={t('label.move', 'Move')}
										inputLabel={inputLabel}
										confirmAction={confirmAction}
										allowFolderCreation={false}
										allowRootSelection
										showSharedAccounts={false}
										showTrashFolder={false}
										showSpamFolder
									/>
								)
							},
							true
						);
					}
				}
			},
			{
				id: FolderActionsType.EMPTY,
				'data-testid': `folder-action-${FolderActionsType.EMPTY}`,
				icon:
					getFolderIdParts(folder.id).id === FOLDERS.TRASH
						? 'DeletePermanentlyOutline'
						: 'EmptyFolderOutline',
				label:
					getFolderIdParts(folder.id).id === FOLDERS.TRASH
						? t('folder_panel.action.empty.trash', 'Empty Trash')
						: t('folder_panel.action.empty.folder_panel', 'Empty Folder'),
				disabled: folder.n === 0 && folder.children?.length === 0,
				onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const modalId = Date.now().toString();
					createModal(
						{
							id: modalId,
							onClose: (): void => {
								closeModal(modalId);
							},
							children: <EmptyModal onClose={(): void => closeModal(modalId)} folder={folder} />
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.EDIT,
				'data-testid': `folder-action-${FolderActionsType.EDIT}`,
				icon: 'Edit2Outline',
				label: folder.isLink
					? t('folder_panel.action.edit_properties', 'Edit Properties')
					: t('label.edit', 'Edit'),
				onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const modalId = Date.now().toString();
					createModal(
						{
							id: modalId,
							maxHeight: '90vh',
							onClose: (): void => {
								closeModal(modalId);
							},
							focusModalContent: false,
							children: <EditModal onClose={(): void => closeModal(modalId)} folder={folder} />
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.DELETE,
				'data-testid': `folder-action-${FolderActionsType.DELETE}`,
				icon: 'Trash2Outline',
				label: startsWith(folder.absFolderPath, '/Trash')
					? t('label.delete_permanently', 'Delete Permanently')
					: t('label.delete', 'Delete'),
				onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const modalId = Date.now().toString();
					createModal(
						{
							id: modalId,
							onClose: (): void => {
								closeModal(modalId);
							},
							children: <DeleteModal onClose={(): void => closeModal(modalId)} folder={folder} />
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.REMOVE_FROM_LIST,
				'data-testid': `folder-action-${FolderActionsType.REMOVE_FROM_LIST}`,
				icon: 'CloseOutline',
				label: t('label.remove_from_this_list', 'Remove from this list'),
				onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
						folderActionSoapApi({ folder, op: 'delete' });
					}
				}
			},
			{
				id: FolderActionsType.SHARES_INFO,
				'data-testid': `folder-action-${FolderActionsType.SHARES_INFO}`,
				icon: 'InfoOutline',
				label: t('label.shares_info', `Shared folder's info`),
				onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
					}
					const modalId = Date.now().toString();
					createModal(
						{
							id: modalId,
							onClose: (): void => {
								closeModal(modalId);
							},
							children: (
								<SharesInfoModal onClose={(): void => closeModal(modalId)} folder={folder} />
							)
						},
						true
					);
				}
			},
			{
				id: FolderActionsType.MARK_ALL_READ,
				'data-testid': `folder-action-${FolderActionsType.MARK_ALL_READ}`,
				icon: 'EmailReadOutline',
				label: t('label.mark_all_as_read', 'Mark all as read'),
				onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					if (e) {
						e.stopPropagation();
						folderActionSoapApi({ folder, op: 'read', l: folder.id });
					}
				}
			},

			{
				id: 'export',
				'data-testid': `folder-action-export-option`,
				icon: 'DownloadOutline',
				tooltipLabel:
					folder.n === 0 && folder.children?.length === 0
						? t('tooltip.export_archive_disabled', 'The folder is empty')
						: undefined,
				label: t('label.export_archive', 'Export Archive'),
				disabled: folder.n === 0 && folder.children?.length === 0,
				onClick: buildExportArchiveOnClick({ folder, name, createModal, closeModal })
			},
			{
				id: 'import',
				'data-testid': `folder-action-import-option`,
				icon: 'UploadOutline',
				label: t('label.import_archive', 'Import Archive'),
				onClick: buildImportArchiveOnClick({
					folder,
					name,
					createModal,
					closeModal,
					createSnackbar
				})
			}
		],
		[folder, folderIsTrash, createModal, closeModal, trashMessages, createSnackbar, name]
	);

	const defaultFolderActions = useMemo(
		() =>
			actions.filter(
				(action) =>
					action.id !== FolderActionsType.SHARES_INFO &&
					action.id !== FolderActionsType.REMOVE_FROM_LIST
			),
		[actions]
	);
	const id =
		folder.id.indexOf(':') !== -1 ? folder.id.slice(folder.id.indexOf(':') + 1) : folder.id;

	switch (id) {
		// default folders
		case FOLDERS.INBOX:
		case FOLDERS.SENT:
			//	case FOLDERS.DRAFTS:
			return defaultFolderActions.map((action) =>
				action.id === FolderActionsType.MOVE || action.id === FolderActionsType.DELETE
					? { ...action, disabled: true }
					: action
			);
		case FOLDERS.DRAFTS:
			return defaultFolderActions.map((action) =>
				action.id === FolderActionsType.MOVE ||
				action.id === FolderActionsType.DELETE ||
				action.id === FolderActionsType.MARK_ALL_READ
					? { ...action, disabled: true }
					: action
			);
		case FOLDERS.SPAM:
			return defaultFolderActions.map((action) =>
				action.id === FolderActionsType.NEW ||
				action.id === FolderActionsType.MOVE ||
				action.id === FolderActionsType.DELETE
					? { ...action, disabled: true }
					: action
			);
		case FOLDERS.TRASH:
			return defaultFolderActions.map((action) =>
				(action.id === FolderActionsType.MOVE && trashMessages.length === 0) ||
				action.id === FolderActionsType.DELETE ||
				action.id === FolderActionsType.EDIT
					? { ...action, disabled: true }
					: action
			);
		case FOLDERS.ARCHIVE:
			return defaultFolderActions.map((action) =>
				action.id === FolderActionsType.MOVE ||
				action.id === FolderActionsType.DELETE ||
				action.id === FolderActionsType.EDIT
					? { ...action, disabled: true }
					: action
			);
		// customizable folders
		default:
			return folder.isLink
				? actions.filter(
						(action) =>
							action.id === FolderActionsType.SHARES_INFO ||
							action.id === FolderActionsType.REMOVE_FROM_LIST ||
							action.id === FolderActionsType.EDIT
					)
				: defaultFolderActions.map((action) => {
						if (
							startsWith(folder.absFolderPath, '/Trash') &&
							(action.id === FolderActionsType.NEW || action.id === FolderActionsType.EDIT)
						) {
							return { ...action, disabled: true };
						}
						return action;
					});
	}
};
