/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ModalFooter from '../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../carbonio-ui-commons/components/modals/modal-header';

type CertificateDeleteModalProps = {
	onClose: () => void;
	onConfirmDelete: () => void;
	email: string;
};

const CertificateDeleteModal: FC<CertificateDeleteModalProps> = ({
	onClose,
	onConfirmDelete,
	email
}): ReactElement => {
	const [t] = useTranslation();
	return (
		<Container padding={{ bottom: 'medium' }}>
			<ModalHeader
				title={t('settings.uploadCertificate.delete_certificate', 'Delete Certificate')}
				onClose={onClose}
			/>
			<Container
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				padding={{ all: 'medium' }}
			>
				<Text overflow="break-word">
					{`${t(
						'settings.uploadCertificate.delete_certificate_text',
						'Are you sure to delete certificate of'
					)} ${email}?`}
				</Text>
			</Container>
			<ModalFooter
				onConfirm={onConfirmDelete}
				label={t('label.delete', 'Delete')}
				background="error"
			/>
		</Container>
	);
};

export default CertificateDeleteModal;
