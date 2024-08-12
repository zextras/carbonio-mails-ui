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
import { replaceHistory, t } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { BackupSearchMessageListItem } from './backup-search-message-list-item';
import { BackupSearchRecoveryModal } from './backup-search-recovery-modal';
import { restoreMessagesAPI } from '../../../api/restore-messages';
import { CustomList } from '../../../carbonio-ui-commons/components/list/list';
import { CustomListItem } from '../../../carbonio-ui-commons/components/list/list-item';
import { BACKUP_SEARCH_STATUS, MAILS_ROUTE } from '../../../constants';
import { useSelection } from '../../../hooks/use-selection';
import { StoreProvider } from '../../../store/redux';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';

export const BackupSearchList = (): React.JSX.Element => {
	const [count, setCount] = useState(0);
	const { messages } = useBackupSearchStore();
	const { itemId } = useParams<{ itemId: string }>();

	const {
		selected: selectedMessage,
		toggle,
		deselectAll,
		selectAll,
		isAllSelected
	} = useSelection({
		currentFolderId: 'backup-search',
		setCount,
		count,
		items: [...Object.values(messages ?? {})]
	});

	const selectedIds = useMemo(() => Object.keys(selectedMessage), [selectedMessage]);
	const createSnackbar = useSnackbar();

	const recoverEmailsCallback = useCallback(
		async (closeModal: () => void) => {
			const response = await restoreMessagesAPI(selectedIds);
			closeModal();
			if ('error' in response) {
				createSnackbar({
					replace: true,
					type: 'error',
					label: t('label.error_recovering_emails', 'Error recovering emails'),
					autoHideTimeout: 5000,
					hideButton: true
				});
				return;
			}
			useBackupSearchStore.getState().setStatus(BACKUP_SEARCH_STATUS.empty);
			useBackupSearchStore.getState().setMessages([]);
			replaceHistory({ route: MAILS_ROUTE, path: '/' });
			createSnackbar({
				replace: true,
				type: 'info',
				label: t(
					'label.recover_emails',
					'The recovery process has started, you will be informed once it is complete'
				),
				autoHideTimeout: 5000,
				hideButton: true
			});
		},
		[createSnackbar, selectedIds]
	);

	const { createModal, closeModal } = useModal();
	const handleRecoverCallback = useCallback(() => {
		const modalId = Date.now().toString();
		createModal(
			{
				id: modalId,
				maxHeight: '90vh',
				children: (
					<StoreProvider>
						<BackupSearchRecoveryModal
							onConfirm={(): Promise<void> =>
								recoverEmailsCallback((): void => closeModal?.(modalId))
							}
							onClose={(): void => closeModal?.(modalId)}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [closeModal, createModal, recoverEmailsCallback]);

	const listItems = useMemo(
		() =>
			map(messages, (message) => {
				const active = itemId === message.id;
				const isSelected = selectedMessage[message.id];
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
									toggle={toggle}
								/>
							) : (
								<div style={{ height: '4rem' }} />
							)
						}
					</CustomListItem>
				);
			}),
		[itemId, messages, selectedMessage, toggle]
	);

	const selectAllOnClick = useCallback(() => {
		selectAll();
		createSnackbar({
			key: 'selected-all-backupMessages',
			replace: true,
			type: 'info',
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
							disabled={!selectedIds.length}
						/>
					</Row>
				</Row>
			</Container>
			<CustomList>{listItems}</CustomList>
		</Container>
	);
};
