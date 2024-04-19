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
	Row
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { RecoverMessagesModal } from './components/recover-messages-modal';
import { recoverMessagesSubSection } from './subsections';
import { undeleteAPI } from '../../api/undelete';
import { PRODUCT_FLAVOR } from '../../constants';
import { StoreProvider } from '../../store/redux';
import { useProductFlavorStore } from '../../store/zustand/product-flavor/store';

export const RecoverMessages = (): React.JSX.Element => {
	const createModal = useModal();
	const createSnackbar = useSnackbar();
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
	const [daysToRemove, setDaysToRemove] = useState(null);
	const [selectValue, setSelectValue] = useState(selectInitialValue);

	const restoreMessages = useCallback(
		(closeModal: CloseModalFn) => {
			if (!daysToRemove) {
				return;
			}
			const now = new Date();
			const endDate = now.toISOString();
			const startDate = new Date(now.setUTCDate(now.getUTCDate() - daysToRemove)).toISOString();

			undeleteAPI(startDate, endDate)
				.then((response) => {
					if (response?.status !== 202) {
						throw new Error('Something went wrong with messages restoration');
					}
					setDaysToRemove(null);
					setSelectValue(selectInitialValue);
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
		[createSnackbar, daysToRemove, selectInitialValue]
	);
	const informativeText = t(
		'settings.label.recover_messages_infotext',
		`You can still retrieve emails deleted from Trash in a period.\nBy clicking “START RECOVERY” you will initiate the process to recover deleted emails. Once the process is completed you will receive a notification in your Inbox and find the recovered emails in Recovered mails folder.`
	);

	const onClick = useCallback(() => {
		const closeModal = createModal(
			{
				children: (
					<StoreProvider>
						<RecoverMessagesModal
							daysToRecover={daysToRemove}
							onClose={(): void => closeModal()}
							onConfirm={(): void => restoreMessages(closeModal)}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [createModal, daysToRemove, restoreMessages]);

	const buttonLabel = t('label.start_recovery', 'Start Recovery');

	const sectionTitle = recoverMessagesSubSection();

	const { productFlavor } = useProductFlavorStore();
	const selectLabel = t('label.recovery_period', 'Select recovery period');

	const onSelectChange = useCallback(
		(value) => {
			setDaysToRemove(value);
			const selectedItem = selectItems.find((item) => item.value === value);
			selectedItem && setSelectValue(selectedItem);
		},
		[selectItems]
	);

	return productFlavor === PRODUCT_FLAVOR.ADVANCED ? (
		<FormSubSection
			id={sectionTitle.id}
			data-testid="product-flavour-form"
			label={sectionTitle.label}
			padding={{ all: 'medium' }}
		>
			<Padding top="large" />
			<Text style={{ whiteSpace: 'pre-line' }}>{informativeText}</Text>
			<Padding top="large" />
			<Row width="100%" mainAlignment="flex-start">
				<Select
					label={selectLabel}
					onChange={onSelectChange}
					items={selectItems}
					selection={selectValue}
					showCheckbox={false}
					style={{ maxWidth: '19rem' }}
				/>
				<Padding left="large" />
				<Button
					type={'outlined'}
					onClick={onClick}
					label={buttonLabel}
					disabled={daysToRemove === null}
				/>
			</Row>
		</FormSubSection>
	) : (
		<></>
	);
};
