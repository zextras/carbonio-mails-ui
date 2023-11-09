/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { CreateModalFn } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { Folder } from '../carbonio-ui-commons/types/folder';
import { GenericActionDescriptors } from '../constants';
import { UIAction, UIActionExecutionParams } from '../types';
import { SelectFolderModal } from '../views/sidebar/select-folder-modal';

export interface SelectFoldersUIActionExecutionParams extends UIActionExecutionParams<Folder> {
	config: {
		confirmActionLabel?: string;
		allowSharedAccounts: boolean;
		allowRootSelection: boolean;
		title?: string;
		hintText?: string;
		selectedFolder?: Folder;
	};
	uiUtilities: {
		createModal: CreateModalFn;
	};
	callbacks: {
		onComplete: (folder: Folder) => void;
		onCancel?: () => void;
	};
}

export const getSelectFoldersUIAction = (): UIAction<SelectFoldersUIActionExecutionParams> => {
	const descriptor = GenericActionDescriptors.SELECT_FOLDERS;
	return {
		id: descriptor.id,
		icon: 'FolderOutline',
		label: t('action.select_folders', 'Select folders'),
		execute: ({ config, uiUtilities, callbacks }): void => {
			const closeModal = uiUtilities.createModal({
				size: 'medium',
				children: (
					<SelectFolderModal
						folder={config.selectedFolder}
						onClose={(): void => {
							closeModal();
							callbacks.onCancel && callbacks.onCancel();
						}}
						headerTitle={config.title ?? t('label.select_folder', 'Select folder')}
						actionLabel={config.confirmActionLabel ?? t('label.select_folder', 'Select folder')}
						inputLabel={config.hintText ?? ''}
						confirmAction={(folder): void => {
							if (!folder) {
								return;
							}
							closeModal();
							callbacks.onComplete && callbacks.onComplete(folder);
						}}
					></SelectFolderModal>
				)
			});
		}
	};
};
