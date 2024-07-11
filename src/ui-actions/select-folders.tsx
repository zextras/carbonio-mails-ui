/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { CreateModalFn, ModalManager } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { SelectFolderModal } from './modals/select-folder-modal';
import { Folder } from '../carbonio-ui-commons/types/folder';
import { GenericActionDescriptors } from '../constants';
import { UIAction, UIActionExecutionParams } from '../types';

export type SelectFoldersUIActionExecutionConfig = {
	showSharedAccounts: boolean;
	showThrashFolder: boolean;
	showSpamFolder: boolean;
	allowRootSelection: boolean;
	allowFolderCreation: boolean;
	title: string;
	hintText: string;
	confirmActionLabel: string;
	confirmActionTooltip: string;
	disabledConfirmActionTooltip: string;
	selectedFolder?: Folder;
};

export interface SelectFoldersUIActionExecutionParams extends UIActionExecutionParams<Folder> {
	config: Partial<SelectFoldersUIActionExecutionConfig>;
	uiUtilities: {
		createModal: CreateModalFn;
	};
	callbacks: {
		onComplete: (folder: Folder) => void;
		onCancel?: () => void;
	};
}

const defaultExecutionConfig: SelectFoldersUIActionExecutionConfig = {
	showSharedAccounts: true,
	showThrashFolder: false,
	showSpamFolder: false,
	allowRootSelection: true,
	allowFolderCreation: false,
	title: t('label.select_folder', 'Select folder'),
	hintText: '',
	confirmActionLabel: t('label.select_folder', 'Select folder'),
	confirmActionTooltip: '',
	disabledConfirmActionTooltip: t('label.no_folder_selected', 'No folder is selected')
};

export const mergeDefaultExecutionConfig = (
	config: Partial<SelectFoldersUIActionExecutionConfig>
): SelectFoldersUIActionExecutionConfig => ({
	...defaultExecutionConfig,
	...config
});

export const getSelectFoldersUIAction = (): UIAction<SelectFoldersUIActionExecutionParams> => {
	const descriptor = GenericActionDescriptors.SELECT_FOLDERS;
	return {
		id: descriptor.id,
		icon: 'FolderOutline',
		label: t('action.select_folders', 'Select folders'),
		openModal: (params): void => {
			const { uiUtilities, callbacks } = params;
			const config = mergeDefaultExecutionConfig(params.config);
			const closeModal = uiUtilities.createModal(
				{
					size: 'medium',
					children: (
						<ModalManager>
							<SelectFolderModal
								folder={config.selectedFolder}
								onClose={(): void => {
									closeModal();
									callbacks.onCancel && callbacks.onCancel();
								}}
								headerTitle={config.title}
								inputLabel={config.hintText}
								actionLabel={config.confirmActionLabel}
								confirmAction={(folder): void => {
									if (!folder) {
										return;
									}
									closeModal();
									callbacks.onComplete && callbacks.onComplete(folder);
								}}
								actionTooltip={config.confirmActionTooltip}
								disabledActionTooltip={config.disabledConfirmActionTooltip}
								allowRootSelection={config.allowRootSelection}
								allowFolderCreation={config.allowFolderCreation}
								showSharedAccounts={config.showSharedAccounts}
								showTrashFolder={config.showThrashFolder}
								showSpamFolder={config.showSpamFolder}
							></SelectFolderModal>
						</ModalManager>
					)
				},
				true
			);
		}
	};
};
