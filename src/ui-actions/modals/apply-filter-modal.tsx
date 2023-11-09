/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	ChipInput,
	ChipItem,
	CloseModalFn,
	ModalFooter,
	ModalHeader,
	Text,
	useModal,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { applyFilterRules } from '../../api/apply-filter-rules';
import { Folder } from '../../carbonio-ui-commons/types/folder';
import { GapContainer } from '../../commons/gap-container';
import { TIMEOUTS } from '../../constants';
import { getFolderIconColor } from '../../views/sidebar/utils';
import type { ApplyFilterUIActionExecutionParams } from '../apply-filter';
import { getSelectFoldersUIAction } from '../select-folders';

export type ApplyFilterModalProps = {
	criteria: ApplyFilterUIActionExecutionParams['criteria'];
	// onConfirm: () => void;
	// onCancel: () => void;
	closeModal: CloseModalFn;
};

/**
 * TODO add a prop to control the 'confirm' button status
 * @param filterName
 * @constructor
 */
export const ApplyFilterModal: FC<ApplyFilterModalProps> = ({ criteria, closeModal }) => {
	const createModal = useModal();
	const createSnackbar = useSnackbar();
	const [folder, setFolder] = useState<Folder>();

	const confirmEnabled = useMemo<boolean>(() => !!folder, [folder]);

	const title = t('modals.apply_filters.title', {
		filterName: criteria.filterName,
		defaultValue: 'Application filter {{filterName}}'
	});

	const confirmActionLabel = t('modals.apply_filters.button_apply', 'Apply');
	const secondaryActionLabel = t('label.cancel', 'Cancel');
	const onConfirmAction = useCallback((): void => {
		if (!folder) {
			return;
		}
		applyFilterRules({
			ruleName: criteria.filterName,
			foldersId: [folder?.id]
		})
			.then((serviceResult) => {
				createSnackbar({
					key: `applyFilter-${criteria.filterName}-completed`,
					type: 'success',
					label: t('messages.snackbar.apply_filter_rules_completed', {
						filterName: criteria.filterName,
						involvedMessagesCount: serviceResult.messagesId.length,
						defaultValue:
							"Filter '{{filterName}}'successfully applied to {{involvedMessagesCount}} messages inside the selected folder"
					}),
					replace: true,
					autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
				});
			})
			.catch((err) => {
				createSnackbar({
					key: `applyFilter-${criteria.filterName}-error`,
					type: 'error',
					label: t('messages.snackbar.apply_filter_rules_error', {
						filterName: criteria.filterName,
						defaultValue: "An error occurred while applying the filter '{{filterName}}'"
					}),
					replace: true,
					autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
				});
			});

		createSnackbar({
			key: `applyFilter-${criteria.filterName}-started`,
			type: 'info',
			label: t('messages.snackbar.apply_filter_rules_started', {
				filterName: criteria.filterName,
				folderPath: folder.absFolderPath,
				defaultValue:
					"Filter '{{filterName}}' is being applied to the messages inside the folder '{{folderPath}}'"
			}),
			replace: true,
			autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
		});
		closeModal();
	}, [closeModal, createSnackbar, criteria.filterName, folder]);

	const onCancelAction = useCallback(() => closeModal(), [closeModal]);

	const onAddFolder = (): void => {
		const action = getSelectFoldersUIAction();
		action.execute &&
			action.execute({
				config: {
					allowRootSelection: false,
					allowSharedAccounts: false
				},
				uiUtilities: {
					createModal
				},
				callbacks: {
					onComplete: setFolder
				}
			});
	};

	const folderChips = useMemo<Array<ChipItem>>(
		() =>
			folder
				? [
						{
							label: folder.absFolderPath,
							hasAvatar: true,
							maxWidth: '12.5rem',
							background: 'gray2',
							avatarBackground: getFolderIconColor(folder),
							avatarIcon: 'FolderOutline',
							value: folder.id
						}
				  ]
				: [],
		[folder]
	);

	return (
		<>
			<ModalHeader onClose={onCancelAction} title={title} showCloseIcon></ModalHeader>
			<GapContainer gap={'medium'} crossAlignment={'flex-start'}>
				<Text>{t('settings.filter_folder_message', 'Select a folder to apply your filter:')}</Text>
				<ChipInput
					background="gray5"
					icon="FolderOutline"
					placeholder={t('label.select_folder', 'Is contained in')}
					value={folderChips}
					maxChips={1}
					disabled
					iconAction={(ev): void => onAddFolder()}
					onChange={(chips): void => {
						// TODO something better to handle the chip deletion, please...
						if (chips.length === 0) {
							setFolder(undefined);
						}
					}}
					requireUniqueChips
				/>
				{folder && (
					<>
						<Text>{folder.n} messages will be processed inside the selected folder.</Text>
						<Text>Do you want to apply the filter?</Text>
					</>
				)}
			</GapContainer>
			<ModalFooter
				confirmLabel={confirmActionLabel}
				confirmDisabled={!confirmEnabled}
				onConfirm={onConfirmAction}
				onSecondaryAction={onCancelAction}
				secondaryActionLabel={secondaryActionLabel}
				onClose={onCancelAction}
			></ModalFooter>
		</>
	);
};
