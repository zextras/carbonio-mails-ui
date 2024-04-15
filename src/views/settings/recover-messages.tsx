/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Text, Button, FormSubSection, Padding } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import moment from 'moment';

import { recoverMessagesSubSection } from './subsections';
import { PRODUCT_FLAVOR } from '../../constants';
import { useProductFlavorStore } from '../../store/zustand/product-flavor/store';

export const RecoverMessages = (): React.JSX.Element => {
	const now = moment().utc();
	const endDate = now.format();
	const startDate = now.subtract(1, 'week').format();

	const restoreMessages = useCallback(() => {
		fetch(`/zx/backup/v1/undelete?start=${startDate}&end=${endDate}`, {
			method: 'POST',
			credentials: 'same-origin'
		});
	}, [endDate, startDate]);
	const informativeText = t(
		'settings.label.recover_messages_infotext',
		`You can still recover emails deleted within the past 7 days from the Trash folder. \n
    By clicking “START RECOVERY” you will initiate the process to recover deleted emails. Once the process is completed you will receive a notification in your Inbox and find the recovered emails in a new dedicated folder.`
	);

	const buttonLabel = t('label.start_recovery', 'Start Recovery');

	const sectionTitle = recoverMessagesSubSection();

	const { productFlavor } = useProductFlavorStore();

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
			<Button type={'outlined'} onClick={restoreMessages} label={buttonLabel} />
		</FormSubSection>
	) : (
		<></>
	);
};
