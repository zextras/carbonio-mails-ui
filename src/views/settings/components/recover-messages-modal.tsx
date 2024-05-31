/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { AnimatedLoader } from '../../../assets/animated-loader';
import ModalFooter from '../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../carbonio-ui-commons/components/modals/modal-header';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';

type RecoverMessagesModalPropType = {
	onConfirm: () => void;
	onClose: () => void;
};
export const RecoverMessagesModal = ({
	onConfirm,
	onClose
}: RecoverMessagesModalPropType): React.JSX.Element => {
	const isLoading = useBackupSearchStore().status === 'loading';
	const modalHeaderTitle = isLoading
		? t('label.searching_recover_emails', 'Searching for e-mails to recover')
		: t('label.search_recover_emails', 'Search e-mails to recover');
	const modalFooterLabel = isLoading
		? t('label.loading_results', 'Loading results...')
		: t('label.start_search', 'Start Search');
	const loadingSubText = ` ${t('label.want_to_continue', 'Do you want to continue?')}`;
	return (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<ModalHeader onClose={onClose} title={modalHeaderTitle} showCloseIcon={!isLoading} />
			<Container
				padding={{ all: 'small' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<Text style={{ whiteSpace: 'pre-line' }}>
					{/* TODO: fix msg */}
					{t(
						'messages.recover_deleted_emails',
						'Recovering deleted e-mails from Trash may take some time. Once the operation is completed, you will be directed to the results.'
					)}
				</Text>
				{!isLoading && <Text>{loadingSubText}</Text>}
				<ModalFooter
					disabled={isLoading}
					onConfirm={onConfirm}
					label={modalFooterLabel}
					primaryButtonIcon={isLoading && AnimatedLoader}
				/>
			</Container>
		</Container>
	);
};
