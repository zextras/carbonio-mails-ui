/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

type PermanentlyDeleteModalProps = {
	onClose: () => void;
	onDeleteConfirm: () => void;
};

export const PermanentlyDeleteModal = ({
	onClose,
	onDeleteConfirm
}: PermanentlyDeleteModalProps): React.JSX.Element => {
	const [t] = useTranslation();

	return (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<ModalHeader
				onClose={onClose}
				title={t(
					'messages.permanent_delete_title',
					'Are you sure to permanently delete this element?'
				)}
			/>
			<Container
				padding={{ all: 'small' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<Text overflow="break-word">
					{t(
						'messages.permanent_delete_body',
						'If you permanently delete this element you will not be able to recover it. Continue?'
					)}
				</Text>
				<ModalFooter
					onConfirm={onDeleteConfirm}
					label={t('label.delete_permanently', 'Delete permanently')}
					background="error"
				/>
			</Container>
		</Container>
	);
};
