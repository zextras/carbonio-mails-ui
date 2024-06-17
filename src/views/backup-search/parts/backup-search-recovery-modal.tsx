/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import ModalFooter from '../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../carbonio-ui-commons/components/modals/modal-header';

type BackupSearchRecoveryModalPropType = {
	onConfirm: () => void;
	onClose: () => void;
};
export const BackupSearchRecoveryModal = ({
	onConfirm,
	onClose
}: BackupSearchRecoveryModalPropType): React.JSX.Element => {
	const modalHeaderTitle = t('label.start_recovery_process', 'Start recovery process');
	const modalContent = t(
		'label.start_recovery_description',
		'Once the process is completed you will receive a notification in your Inbox and find the recovered e-mails in a brand new folder.'
	);

	const modalFooterLabel = t('label.start_recovery', 'Start Recovery');
	return (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<ModalHeader onClose={onClose} title={modalHeaderTitle} />
			<Container
				padding={{ all: 'small' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<Text style={{ whiteSpace: 'pre-line' }}>{modalContent}</Text>
				<ModalFooter onConfirm={onConfirm} label={modalFooterLabel} />
			</Container>
		</Container>
	);
};
