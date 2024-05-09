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
	daysToRecover: number | null;
	onConfirm: () => void;
	onClose: () => void;
};
export const RecoverMessagesModal = ({
	daysToRecover,
	onConfirm,
	onClose
}: RecoverMessagesModalPropType): React.JSX.Element => (
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
				{t('messages.recover_messages_modal_body', {
					daysToRecover,
					defaultValue:
						'Do you want to recover emails deleted within the past {{daysToRecover}} days from the Trash folder?\nRecovering emails deleted from Trash can take some time.'
				})}
			</Text>
			<ModalFooter onConfirm={onConfirm} label={t('label.confirm', 'Confirm')} />
		</Container>
	</Container>
);
