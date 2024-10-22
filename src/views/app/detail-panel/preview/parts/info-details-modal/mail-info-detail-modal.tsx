/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MailGeneralInfoSubsection } from './mail-general-info-subsection';
import { SmimeSubsection } from './smime-subsection';
import ModalFooter from '../../../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../../../carbonio-ui-commons/components/modals/modal-header';
import { MessageSignature } from '../../../../../../types';

type MailInfoDetailModalProps = {
	onClose: () => void;
	signature?: MessageSignature;
	messageIdFromMailHeaders?: string;
	creationDateFromMailHeaders?: string;
};

export const MailInfoDetailModal: FC<MailInfoDetailModalProps> = ({
	onClose,
	signature,
	messageIdFromMailHeaders,
	creationDateFromMailHeaders
}) => {
	const [t] = useTranslation();
	return (
		<Container
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
			data-testid="info-details-modal"
		>
			<ModalHeader
				title={t('messages.modal.info_details.title', 'Message details')}
				onClose={onClose}
			/>
			<MailGeneralInfoSubsection
				messageIdFromMailHeaders={messageIdFromMailHeaders}
				creationDateFromMailHeaders={creationDateFromMailHeaders}
			/>
			{/* TODO: <MailHeadersSubsection signature={signature} /> */}
			<SmimeSubsection signature={signature} />
			<ModalFooter
				onConfirm={(): void => {
					onClose();
				}}
				label={t('label.close', 'Close')}
			/>
		</Container>
	);
};
