/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	ChipInput,
	ChipItem,
	Divider,
	ModalFooter,
	ModalHeader,
	Text,
	useModal,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { Trans } from 'react-i18next';

import { applyFilterRules } from '../../api/apply-filter-rules';
import { Folder } from '../../carbonio-ui-commons/types/folder';
import { GapContainer } from '../../commons/gap-container';
import { TextStyler } from '../../commons/text-styler';
import { TIMEOUTS } from '../../constants';
import { getFolderIconColor } from '../../views/sidebar/utils';
import type { ApplyFilterUIActionExecutionParams } from '../apply-filter';
import { getSelectFoldersUIAction } from '../select-folders';

export type ApplyFilterModalProps = {
	criteria: ApplyFilterUIActionExecutionParams['criteria'];
	onClose: () => void;
};

export const ApplyFilterModal: FC<ApplyFilterModalProps> = ({ criteria, onClose }) => {
	const { createModal, closeModal } = useModal();
	const createSnackbar = useSnackbar();
	const [folder, setFolder] = useState<Folder>();

	const involvedMessagesCount = folder?.n ?? 0;
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
						folderPath: folder.absFolderPath,
						defaultValue:
							"Filter '{{filterName}}'successfully applied to {{involvedMessagesCount}} messages of the folder '{{folderPath}}'"
					}),
					replace: true,
					autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
					hideButton: true
				});
			})
			.catch((err) => {
				createSnackbar({
					key: `applyFilter-${criteria.filterName}-error`,
					type: 'info',
					label:
						err && err !== ''
							? err
							: t(
									'messages.snackbar.apply_filter_error',
									`Filter is still running on the server but it’s taking too much time to report the affected items. The filter keeps working on the server without additional information`
								),
					replace: true,
					autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
					hideButton: true
				});
			});

		createSnackbar({
			key: `applyFilter-${criteria.filterName}-started`,
			type: 'info',
			label: t('messages.snackbar.apply_filter_rules_started', {
				filterName: criteria.filterName,
				folderPath: folder.absFolderPath,
				defaultValue:
					"Filter '{{filterName}}' is being applied to the messages of the folder '{{folderPath}}'"
			}),
			replace: true,
			autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
			hideButton: true
		});
		onClose();
	}, [createSnackbar, criteria.filterName, folder, onClose]);

	const onCancelAction = useCallback(() => onClose(), [onClose]);

	const onAddFolder = (): void => {
		const action = getSelectFoldersUIAction();
		action?.openModal?.({
			config: {
				allowRootSelection: false,
				showSharedAccounts: false,
				allowFolderCreation: false,
				showThrashFolder: true,
				showSpamFolder: true
			},
			uiUtilities: {
				closeModal,
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
			<Divider />
			<GapContainer
				gap={'medium'}
				mainAlignment={'flex-start'}
				crossAlignment={'flex-start'}
				minHeight={'13.63rem'}
				padding={{ top: 'small' }}
			>
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
						<Text>
							<Trans
								t={t}
								i18nKey="modals.apply_filters.label_involved_messages"
								involvedMessagesCount={involvedMessagesCount}
							>
								<TextStyler bold>{{ involvedMessagesCount }} messages</TextStyler> will be processed
								inside the selected folder.
							</Trans>
						</Text>
						<Text>
							<Trans t={t} i18nKey="modals.apply_filters.label_confirm_msg">
								The more messages are present, the more time will be required to apply the filter.
							</Trans>
						</Text>
						<Text>
							<Trans t={t} i18nKey="modals.apply_filters.label_confirm_request">
								Do you want to apply the filter?
							</Trans>
						</Text>
					</>
				)}
			</GapContainer>
			<Divider />
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
