/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';

import {
	Text,
	Button,
	FormSubSection,
	Padding,
	useModal,
	CloseModalFn,
	useSnackbar,
	Select,
	Row,
	Input,
	Container
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { RecoverMessagesModal } from './components/recover-messages-modal';
import { recoverMessagesSubSection } from './subsections';
import { useAppDispatch } from '../../hooks/redux';
import { searchInBackupAPI } from '../../store/actions/searchInBackup';
import { StoreProvider } from '../../store/redux';
import { useAdvancedAccountStore } from '../../store/zustand/advanced-account/store';

export const RecoverMessages = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const createModal = useModal();
	const createSnackbar = useSnackbar();
	const [keyword, setKeyword] = useState(undefined);
	const selectInitialValue = useMemo(() => ({ label: '', value: 0 }), []);
	const selectItems = useMemo(
		() => [
			{ label: t('label.last_7_days', 'Last 7 days'), value: 7 },
			{ label: t('label.last_14_days', 'Last 14 days'), value: 14 },
			{ label: t('label.last_30_days', 'Last 30 days'), value: 30 },
			{ label: t('label.last_90_days', 'Last 90 days'), value: 90 }
		],
		[]
	);
	const [daysToRecover, setDaysToRecover] = useState(null);
	const [selectValue, setSelectValue] = useState(selectInitialValue);

	const restoreMessages = useCallback(
		(closeModal: CloseModalFn) => {
			if (!daysToRecover) {
				return;
			}
			const now = new Date();
			const endDate = now.toISOString();
			now.setUTCDate(now.getUTCDate() - daysToRecover);
			const startDate = now.toISOString();

			dispatch(searchInBackupAPI({ startDate, endDate, keyword }))
				.then((response) => {
					console.log('@@response', response);
					if (response?.type.includes('rejected')) {
						alert(1);
						throw new Error('Something went wrong with the search inside the backup');
					}
					setDaysToRecover(null);
					setSelectValue(selectInitialValue);
					setKeyword(undefined);
					closeModal();
				})
				.catch(() => {
					createSnackbar({
						key: `recover-messages-error`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				});
		},
		[createSnackbar, daysToRecover, dispatch, keyword, selectInitialValue]
	);

	const informativeText = t(
		'settings.label.recover_messages_infotext',
		`You can still retrieve emails deleted from Trash in a period.\nBy clicking “START RECOVERY” you will initiate the process to recover deleted emails. Once the process is completed you will receive a notification in your Inbox and find the recovered emails in Recovered mails folder.`
	);
	const buttonLabel = t('label.start_recovery', 'Start Recovery');
	const selectLabel = t('label.recovery_period', 'Select recovery period');
	const sectionTitle = recoverMessagesSubSection();
	const { backupSelfUndeleteAllowed } = useAdvancedAccountStore();

	const onClick = useCallback(() => {
		const closeModal = createModal(
			{
				children: (
					<StoreProvider>
						<RecoverMessagesModal
							daysToRecover={daysToRecover}
							onClose={(): void => closeModal()}
							onConfirm={(): void => restoreMessages(closeModal)}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [createModal, daysToRecover, restoreMessages]);

	const onSelectChange = useCallback(
		(value) => {
			setDaysToRecover(value);
			const selectedItem = selectItems.find((item) => item.value === value);
			selectedItem && setSelectValue(selectedItem);
		},
		[selectItems]
	);

	const handleTextFilterValueChange = useCallback((ev) => {
		setKeyword(ev.target.value);
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
						value={keyword}
						onChange={handleTextFilterValueChange}
						label={t('settings.keyword', 'Keyword')}
					/>
				</Row>
				<Padding top="large" />
				<Row width="30%" mainAlignment="flex-start">
					<Select
						label={selectLabel}
						onChange={onSelectChange}
						items={selectItems}
						selection={selectValue}
						showCheckbox={false}
					/>
				</Row>
				<Padding top="large" />
				<Row width="30%" mainAlignment="flex-start">
					<Button
						type={'outlined'}
						onClick={onClick}
						label={buttonLabel}
						// todo: change the disabled btn condition based on the mock
						disabled={false}
					/>
				</Row>
			</Container>
		</FormSubSection>
	) : (
		<></>
	);
};
