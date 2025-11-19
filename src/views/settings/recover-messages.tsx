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
	useSnackbar,
	Row,
	Input,
	Container,
	DateTimePicker,
	FormSection
} from '@zextras/carbonio-design-system';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { isEmpty } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { searchBackupDeletedMessagesApi } from 'api/search-backup-deleted-messages-api';
import {
	BACKUP_SEARCH_ROUTE,
	BACKUP_SEARCH_STATUS,
	RECOVER_MESSAGES_INTERVAL
} from 'constants/index';
import { useAdvancedAccountStore } from 'store/advanced-account/store';
import { useBackupSearchStore } from 'store/backup-search/store';
import { RecoverMessagesModal } from 'views/settings/components/recover-messages-modal';
import { recoverMessagesSubSection } from 'views/settings/subsections';

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
	const { createModal, closeModal } = useModal();
	const createSnackbar = useSnackbar();
	const { zimbraPrefLocale } = useUserSettings().prefs;
	const [searchString, setSearchString] = useState('');
	const [recoverDay, setRecoverDay] = useState<Date | null>(null);
	const navigate = useNavigate();

	const restoreMessages = useCallback(
		async (id: string) => {
			if (!recoverDay && !searchString) return;
			const backupSearchStoreState = useBackupSearchStore.getState();

			backupSearchStoreState.setStatus(BACKUP_SEARCH_STATUS.loading);
			const interval = calculateInterval(recoverDay);
			const searchParams = {
				...interval,
				...(searchString === '' ? {} : { searchString })
			};
			const response = await searchBackupDeletedMessagesApi(searchParams);
			closeModal(id);

			if ('error' in response) {
				createSnackbar({
					key: `recover-messages-error`,
					replace: true,
					severity: 'error',
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
					severity: 'info',
					label: t('label.error_no_backup_messages', 'Your search did not find any message'),
					autoHideTimeout: 3000,
					hideButton: true
				});
				return;
			}
			navigate(`/${BACKUP_SEARCH_ROUTE}`, { replace: true });
		},
		[closeModal, createSnackbar, navigate, recoverDay, searchString]
	);

	const sectionTitle = recoverMessagesSubSection();
	const { backupSelfUndeleteAllowed } = useAdvancedAccountStore();

	const handleModalConfirmOnClick = useCallback(() => {
		const modalId = Date.now().toString();
		createModal(
			{
				id: modalId,
				onClose: (): void => {
					closeModal(modalId);
				},
				children: (
					<RecoverMessagesModal
						onClose={(): void => closeModal(modalId)}
						onConfirm={(): Promise<void> => restoreMessages(modalId)}
					/>
				)
			},
			true
		);
	}, [closeModal, createModal, restoreMessages]);

	const onDateTimePickerChange = useCallback((value: Date | null) => {
		setRecoverDay(value);
	}, []);

	const handleTextFilterValueChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
		setSearchString(ev.target.value);
	}, []);

	return backupSelfUndeleteAllowed ? (
		<FormSection
			label={sectionTitle.label}
			id={sectionTitle.id}
			data-testid="recover-messages-form"
		>
			<FormSubSection>
				<Text overflow="break-word" style={{ whiteSpace: 'pre-line' }}>
					{t(
						'settings.label.recover_messages_infotext',
						`Recover e-mails deleted from the Trash by typing a keyword included within the first 100 characters of the message or by selecting a date.\n
                        The selected date will include emails deleted 3 days before and 3 days after.\n
                        Once the search is completed you will be redirected to the results page where you can choose which items to restore.`
					)}
				</Text>
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
							label={t('label.select_recovery_date', 'Select recovery date')}
							isClearable
							width="fill"
							onChange={onDateTimePickerChange}
							timeCaption={t('label.time', 'Time')}
							showTimeSelect={false}
							locale={zimbraPrefLocale}
							dateFormat="P"
							maxDate={new Date()}
						/>
					</Row>
					<Padding top="large" />
					<Row width="30%" mainAlignment="flex-start">
						<Button
							type={'outlined'}
							onClick={handleModalConfirmOnClick}
							label={t('label.search_emails', 'SEARCH E-MAILS')}
							disabled={!recoverDay && !searchString}
						/>
					</Row>
				</Container>
			</FormSubSection>
		</FormSection>
	) : (
		<></>
	);
};
