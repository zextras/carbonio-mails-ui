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
import { replaceHistory, t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { isEmpty } from 'lodash';

import { RecoverMessagesModal } from './components/recover-messages-modal';
import { recoverMessagesSubSection } from './subsections';
import { searchBackupDeletedMessagesAPI } from '../../api/search-backup-deleted-messages';
import {
	BACKUP_SEARCH_ROUTE,
	BACKUP_SEARCH_STATUS,
	RECOVER_MESSAGES_INTERVAL
} from '../../constants';
import { StoreProvider } from '../../store/redux';
import { useAdvancedAccountStore } from '../../store/zustand/advanced-account/store';
import { useBackupSearchStore } from '../../store/zustand/backup-search/store';

function calculateInterval(recoverDate: Date | null): { startDate?: Date; endDate?: Date } {
	if (!recoverDate) return {};

	const startDate = new Date(recoverDate);
	const endDate = new Date(recoverDate);

	startDate.setUTCDate(recoverDate.getUTCDate() - RECOVER_MESSAGES_INTERVAL);
	endDate.setUTCDate(recoverDate.getUTCDate() + RECOVER_MESSAGES_INTERVAL + 1);
	endDate.setMilliseconds(endDate.getMilliseconds() - 1);

	return { startDate, endDate };
}

export const RecoverMessages = (): React.JSX.Element => {
	const createModal = useModal();
	const createSnackbar = useSnackbar();
	const { zimbraPrefLocale } = useUserSettings().prefs;
	const [searchString, setSearchString] = useState('');
	const [recoverDay, setRecoverDay] = useState<Date | null>(null);

	const restoreMessages = useCallback(
		async (closeModal: CloseModalFn) => {
			if (!recoverDay && !searchString) return;
			const backupSearchStoreState = useBackupSearchStore.getState();

			backupSearchStoreState.setStatus(BACKUP_SEARCH_STATUS.loading);
			const interval = calculateInterval(recoverDay);
			const searchParams = {
				...interval,
				...(searchString === '' ? {} : { searchString })
			};
			const response = await searchBackupDeletedMessagesAPI(searchParams);
			closeModal();

			if ('error' in response) {
				createSnackbar({
					key: `recover-messages-error`,
					replace: true,
					type: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 3000,
					hideButton: true
				});
				return;
			}
			backupSearchStoreState.setStatus(BACKUP_SEARCH_STATUS.completed);
			backupSearchStoreState.setMessages(response.data.messages);
			backupSearchStoreState.setSearchParams(searchParams);
			setRecoverDay(null);
			setSearchString('');

			if (isEmpty(response.data.messages)) {
				createSnackbar({
					key: `recover-no-messages-error`,
					replace: true,
					type: 'info',
					label: t('label.error_no_backup_messages', 'Your search did not find any message'),
					autoHideTimeout: 3000,
					hideButton: true
				});
				return;
			}
			replaceHistory({ route: BACKUP_SEARCH_ROUTE, path: '/' });
		},
		[createSnackbar, recoverDay, searchString]
	);

	const informativeText = t(
		'settings.label.recover_messages_infotext',
		`You can still retrieve emails deleted from Trash in a period.\nBy clicking “START RECOVERY” you will initiate the process to recover deleted emails. Once the process is completed you will receive a notification in your Inbox and find the recovered emails in Recovered mails folder.`
	);
	const buttonLabel = t('label.start_recovery', 'Start Recovery');
	const datePickerLabel = t('label.select_recovery_date', 'Select recovery date');
	const sectionTitle = recoverMessagesSubSection();
	const { backupSelfUndeleteAllowed } = useAdvancedAccountStore();

	const handleModalConfirmOnClick = useCallback(() => {
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

	const onDateTimePickerChange = useCallback((value) => {
		setRecoverDay(value);
	}, []);

	const handleTextFilterValueChange = useCallback((ev) => {
		setSearchString(ev.target.value);
	}, []);

	return backupSelfUndeleteAllowed ? (
		<FormSubSection
			id={sectionTitle.id}
			data-testid="recover-messages-form"
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
						onChange={onDateTimePickerChange}
						timeCaption={t('label.time', 'Time')}
						includeTime={false}
						locale={zimbraPrefLocale}
					/>
				</Row>
				<Padding top="large" />
				<Row width="30%" mainAlignment="flex-start">
					<Button
						type={'outlined'}
						onClick={handleModalConfirmOnClick}
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
