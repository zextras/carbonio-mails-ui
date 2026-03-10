/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { CloseModalFn, CreateModalFn, ModalManager } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { Folder } from '@zextras/carbonio-ui-commons';
import { noop } from 'lodash';

import { GenericActionDescriptors } from 'constants/index';
import {
	SelectFoldersUIActionExecutionConfig,
	UIAction,
	UIActionExecutionParams
} from 'types/actions';
import { SelectFolderModal } from 'ui-actions/modals/select-folder-modal';

export interface SelectFoldersUIActionExecutionParams extends UIActionExecutionParams<Folder> {
	config: Partial<SelectFoldersUIActionExecutionConfig>;
	uiUtilities: {
		closeModal: CloseModalFn;
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
		uiUtilities: {
			createModal: noop
		},
		openModal: (params): void => {
			const { uiUtilities, callbacks } = params;
			const id = Date.now().toString();
			const config = mergeDefaultExecutionConfig(params.config);
			uiUtilities.createModal(
				{
					id,
					size: 'medium',
					onClose: (): void => {
						uiUtilities.closeModal(id);
						callbacks.onCancel?.();
					},
					children: (
						<ModalManager>
							<SelectFolderModal
								folder={config.selectedFolder}
								onClose={(): void => {
									uiUtilities.closeModal(id);
									callbacks.onCancel?.();
								}}
								headerTitle={config.title}
								inputLabel={config.hintText}
								actionLabel={config.confirmActionLabel}
								confirmAction={(folder): void => {
									if (!folder) {
										return;
									}
									uiUtilities.closeModal(id);
									callbacks.onComplete(folder);
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
