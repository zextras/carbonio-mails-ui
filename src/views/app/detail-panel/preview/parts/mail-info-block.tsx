/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback } from 'react';

import { Container, Link, useModal } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { DistributionListIcon } from './distribution-list-icon';
import { ExternalDomainIcon } from './external-domain-icon';
import { MailInfoDetailModal } from './info-details-modal/mail-info-detail-modal';
import { MailAuthenticationHeaderIcon } from './mail-authentication-header-icon';
import { MailSensitivityIcon } from './mail-sensitivity-icon';
import { SmimeIcon } from './smime-icon';
import { StoreProvider } from '../../../../../store/redux';
import { IncompleteMessage } from '../../../../../types';

type MailInfoProps = {
	msg: IncompleteMessage;
};

export const MailInfoBlock: FC<MailInfoProps> = ({ msg }): ReactElement => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();

	const signature = msg?.signature?.[0];
	const creationDateFromHeaders = msg?.creationDateFromMailHeaders;
	const messageIdFromHeaders = msg?.messageIdFromMailHeaders;

	const onClick = useCallback(() => {
		const modalId = 'mail-details-modal';
		createModal(
			{
				id: modalId,
				maxHeight: '90vh',
				children: (
					<StoreProvider>
						<MailInfoDetailModal
							onClose={(): void => closeModal(modalId)}
							signature={signature}
							creationDateFromMailHeaders={creationDateFromHeaders}
							messageIdFromMailHeaders={messageIdFromHeaders}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [closeModal, createModal, creationDateFromHeaders, messageIdFromHeaders, signature]);

	return (
		<Container orientation="horizontal" padding={{ all: 'small' }} mainAlignment="flex-start">
			<SmimeIcon signature={signature} />
			<ExternalDomainIcon fromExternalDomain={msg.isFromExternalDomain} />
			<MailSensitivityIcon sensitivity={msg?.sensitivity} />
			<MailAuthenticationHeaderIcon mailAuthenticationHeaders={msg?.authenticationHeaders} />
			<DistributionListIcon isDistributionList={msg?.isFromDistributionList} />
			<Link size="medium" onClick={onClick}>
				{t('label.show_details', 'Show Details')}
			</Link>
		</Container>
	);
};
