/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container, Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ModalFooter from '../../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../../carbonio-ui-commons/components/modals/modal-header';

type SmimeDetailsModalProps = {
	onClose: () => void;
};

export const SmimeDetailsModal: FC<SmimeDetailsModalProps> = ({ onClose }) => {
	const [t] = useTranslation();
	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<ModalHeader
				title={t('messages.modal.smime.title', 'S/MIME signature details')}
				onClose={onClose}
			/>
			<Container mainAlignment="flex-start" orientation="vertical" crossAlignment="flex-start">
				<Row>
					<Text>{t('messages.modal.smime.signed_by', 'Signed By')}: --- </Text>
				</Row>
				<Row>
					<Text>{t('messages.modal.smime.issuer', 'Issuer')}: --- </Text>
				</Row>
				<Row>
					<Text>{t('messages.modal.smime.validity', 'Validity')}: --- </Text>
				</Row>
			</Container>

			<ModalFooter
				onConfirm={(): void => {
					onClose();
				}}
				label={t('label.close', 'Close')}
			/>
		</Container>
	);
};
