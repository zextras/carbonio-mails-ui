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

type RecoverMessagesModalPropType = {
	recoverDay: number | null;
	onConfirm: () => void;
	onClose: () => void;
};
export const RecoverMessagesModal = ({
	recoverDay,
	onConfirm,
	onClose
}: RecoverMessagesModalPropType): React.JSX.Element => {
	const confirmButtonIsDisable = false;
	return (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<ModalHeader onClose={onClose} title={t('label.recover_messages', 'Recover Messages')} />
			<Container
				padding={{ all: 'small' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<Text style={{ whiteSpace: 'pre-line' }}>
					{/* TODO: fix msg */}
					{t('messages.recover_messages_modal_body', {
						recoverDay,
						defaultValue:
							'Once the process is completed you will receive a notification in your Inbox and find the recovered e-mails in a brand new folder.'
					})}
				</Text>
				<ModalFooter
					disabled={confirmButtonIsDisable}
					onConfirm={onConfirm}
					label={t('label.confirm', 'Confirm')}
				/>
			</Container>
		</Container>
	);
};
