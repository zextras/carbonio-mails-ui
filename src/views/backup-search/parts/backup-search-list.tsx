/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import {
	Button,
	Container,
	Padding,
	Row,
	useModal,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { CustomList, CustomListItem } from '@zextras/carbonio-ui-commons';
import { useNavigate, useParams } from 'react-router-dom';

import { restoreMessagesApi } from 'api/restore-messages-api';
import { BACKUP_SEARCH_STATUS, MAILS_ROUTE } from 'constants/index';
import { useMultipleSelection } from 'hooks/use-multiple-selection';
import { useBackupSearchStore } from 'store/backup-search/store';
import { BackupSearchMessageListItem } from 'views/backup-search/parts/backup-search-message-list-item';
import { BackupSearchRecoveryModal } from 'views/backup-search/parts/backup-search-recovery-modal';

export const BackupSearchList = (): React.JSX.Element => {
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
	const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
	const { messages } = useBackupSearchStore();
	const { itemId } = useParams<{ itemId: string }>();
	const navigate = useNavigate();

	const { selectRange, deselectAll, selectAll, isAllSelected } = useMultipleSelection({
		lastSelectedIndex,
		setLastSelectedIndex,
		allAvailableItems: [...Object.keys(messages ?? {})],
		selectedItems,
		setSelectedItems
	});

	const createSnackbar = useSnackbar();

	const recoverEmailsCallback = useCallback(
		async (closeModal: () => void) => {
			const response = await restoreMessagesApi(Array.from(selectedItems));
			closeModal();
			if ('error' in response) {
				createSnackbar({
					replace: true,
					severity: 'error',
					label: t('label.error_recovering_emails', 'Error recovering emails'),
					autoHideTimeout: 5000,
					hideButton: true
				});
				return;
			}
			useBackupSearchStore.getState().setStatus(BACKUP_SEARCH_STATUS.empty);
			useBackupSearchStore.getState().setMessages([]);
			navigate(`/${MAILS_ROUTE}`, { replace: true });
			createSnackbar({
				replace: true,
				severity: 'info',
				label: t(
					'label.recover_emails',
					'The recovery process has started, you will be informed once it is complete'
				),
				autoHideTimeout: 5000,
				hideButton: true
			});
		},
		[createSnackbar, navigate, selectedItems]
	);

	const { createModal, closeModal } = useModal();
	const handleRecoverCallback = useCallback(() => {
		const modalId = Date.now().toString();
		createModal(
			{
				id: modalId,
				maxHeight: '90vh',
				onClose: (): void => {
					closeModal?.(modalId);
				},
				children: (
					<BackupSearchRecoveryModal
						onConfirm={(): Promise<void> =>
							recoverEmailsCallback((): void => closeModal?.(modalId))
						}
						onClose={(): void => closeModal?.(modalId)}
					/>
				)
			},
			true
		);
	}, [closeModal, createModal, recoverEmailsCallback]);

	const listItems = useMemo(
		() =>
			Object.values(messages).map((message, index) => {
				const active = itemId === message.id;
				const isSelected = selectedItems?.has(message.id);
				return (
					<CustomListItem
						key={message.id}
						active={active}
						selected={isSelected}
						background={'gray6'}
					>
						{(visible: boolean): ReactElement =>
							visible ? (
								<BackupSearchMessageListItem
									message={message}
									messageIsSelected={isSelected}
									onSelect={selectRange}
									index={index}
								/>
							) : (
								<div style={{ height: '4rem' }} />
							)
						}
					</CustomListItem>
				);
			}),
		[itemId, messages, selectRange, selectedItems]
	);

	const selectAllOnClick = useCallback(() => {
		selectAll();
		createSnackbar({
			key: 'selected-all-backupMessages',
			replace: true,
			severity: 'info',
			label: t('label.all_items_selected', 'All visible backupMessages have been selected'),
			autoHideTimeout: 5000,
			hideButton: true
		});
	}, [selectAll, createSnackbar]);

	return (
		<Container background="gray6" width="25%" height="fill" mainAlignment="flex-start">
			<Container
				background="gray5"
				height="fit"
				orientation="horizontal"
				padding={{ all: 'extrasmall' }}
				mainAlignment="flex-start"
				width="100%"
			>
				<Row
					height="100%"
					width="fill"
					padding={{ all: 'extrasmall' }}
					mainAlignment="flex-start"
					takeAvailableSpace
				>
					<Button
						label={
							isAllSelected
								? t('label.deselect_all', 'DESELECT all')
								: t('label.select_all', 'SELECT all')
						}
						color="primary"
						onClick={isAllSelected ? deselectAll : selectAllOnClick}
						size="medium"
						type="ghost"
					/>
					<Padding left="small" />
					<Row takeAvailableSpace>
						<Button
							label={t('label.recover_selected_emails', 'RECOVER SELECTED E-MAILS')}
							color="primary"
							onClick={handleRecoverCallback}
							size="medium"
							type="outlined"
							width="fill"
							disabled={selectedItems.size === 0}
						/>
					</Row>
				</Row>
			</Container>
			<CustomList>{listItems}</CustomList>
		</Container>
	);
};
