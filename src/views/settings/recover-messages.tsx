/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState } from 'react';

import {
	Text,
	Button,
	FormSubSection,
	Padding,
	useModal,
	CloseModalFn,
	useSnackbar,
	Row,
	Input,
	Container,
	DateTimePicker
} from '@zextras/carbonio-design-system';
import { replaceHistory, t } from '@zextras/carbonio-shell-ui';

import { RecoverMessagesModal } from './components/recover-messages-modal';
import { recoverMessagesSubSection } from './subsections';
import { searchBackupDeletedMessagesAPI } from '../../api/search-backup-deleted-messages';
import { BACKUP_SEARCH_ROUTE, BACKUP_SEARCH_STATUS } from '../../constants';
import { StoreProvider } from '../../store/redux';
import { useAdvancedAccountStore } from '../../store/zustand/advanced-account/store';
import { useBackupSearchStore } from '../../store/zustand/backup-search/store';

function calculateInterval(recoverDate: string | null): { startDate?: string; endDate?: string } {
	if (!recoverDate) return {};

	const date = new Date(recoverDate);
	const startDate = new Date(date);
	const endDate = new Date(date);

	startDate.setUTCDate(date.getUTCDate() - 2);
	endDate.setUTCDate(date.getUTCDate() + 2);

	return {
		startDate: startDate.toISOString(),
		endDate: endDate.toISOString()
	};
}

export const RecoverMessages = (): React.JSX.Element => {
	const createModal = useModal();
	const createSnackbar = useSnackbar();
	const [searchString, setSearchString] = useState('');
	const [recoverDay, setRecoverDay] = useState(null);

	const restoreMessages = useCallback(
		async (closeModal: CloseModalFn) => {
			if (!recoverDay && !searchString) return;
			useBackupSearchStore.getState().setStatus(BACKUP_SEARCH_STATUS.loading);
			const interval = calculateInterval(recoverDay);
			const response = await searchBackupDeletedMessagesAPI({
				...interval,
				...(searchString === '' ? {} : { searchString })
			});
			useBackupSearchStore.getState().setStatus(BACKUP_SEARCH_STATUS.completed);
			if (response) {
				useBackupSearchStore.getState().setMessages(response.messages);
				setRecoverDay(null);
				setSearchString('');
				closeModal();
				replaceHistory({ route: BACKUP_SEARCH_ROUTE, path: '/' });
			} else {
				createSnackbar({
					key: `recover-messages-error`,
					replace: true,
					type: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		},
		[createSnackbar, recoverDay, searchString]
	);

	const informativeText = t(
		'settings.label.recover_messages_infotext',
		`You can still retrieve emails deleted from Trash in a period.\nBy clicking “START RECOVERY” you will initiate the process to recover deleted emails. Once the process is completed you will receive a notification in your Inbox and find the recovered emails in Recovered mails folder.`
	);
	const buttonLabel = t('label.start_recovery', 'Start Recovery');
	const datePickerLabel = 'Select rocovery date';
	const sectionTitle = recoverMessagesSubSection();
	const { backupSelfUndeleteAllowed } = useAdvancedAccountStore();

	const onClick = useCallback(() => {
		const closeModal = createModal(
			{
				children: (
					<StoreProvider>
						<RecoverMessagesModal
							onClose={(): void => closeModal()}
							onConfirm={(): Promise<void> => restoreMessages(closeModal)}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [createModal, restoreMessages]);

	const onSelectChange = useCallback((value) => {
		setRecoverDay(value);
	}, []);

	const handleTextFilterValueChange = useCallback((ev) => {
		setSearchString(ev.target.value);
	}, []);

	return backupSelfUndeleteAllowed ? (
		<FormSubSection
			id={sectionTitle.id}
			data-testid="backup-self-undelete-form"
			label={sectionTitle.label}
			padding={{ all: 'medium' }}
		>
			<Padding top="large" />
			<Text style={{ whiteSpace: 'pre-line' }}>{informativeText}</Text>
			<Padding top="large" />
			<Container width="100%" crossAlignment="flex-start">
				<Row width="30%" mainAlignment="flex-start">
					<Input
						value={searchString}
						onChange={handleTextFilterValueChange}
						label={t('settings.keyword', 'Keyword')}
					/>
				</Row>
				<Padding top="large" />
				<Row width="30%" mainAlignment="flex-start">
					<DateTimePicker
						label={datePickerLabel}
						isClearable
						width="fill"
						onChange={onSelectChange}
						timeCaption={t('label.time', 'Time')}
						includeTime={false}
						dateFormat="dd/MM/yyyy"
						// timeIntervals={7}
						// format="DD MMM YYYY"
					/>
				</Row>
				<Padding top="large" />
				<Row width="30%" mainAlignment="flex-start">
					<Button
						type={'outlined'}
						onClick={onClick}
						label={buttonLabel}
						disabled={!recoverDay && !searchString}
					/>
				</Row>
			</Container>
		</FormSubSection>
	) : (
		<></>
	);
};
