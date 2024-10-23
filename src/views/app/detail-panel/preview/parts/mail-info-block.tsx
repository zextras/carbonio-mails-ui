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
	const fromDistributionList = msg?.isFromDistributionList;
	const fromExternalDomain = msg?.isFromExternalDomain;
	const sensitivity = msg?.sensitivity;
	const authenticationHeaders = msg?.authenticationHeaders;

	const showMailDetailsModal = useCallback(
		(event: React.MouseEvent): void => {
			event.stopPropagation();

			const modalId = 'mail-details-modal';
			createModal(
				{
					id: modalId,
					maxHeight: '90vh',
					children: (
						<StoreProvider>
							<MailInfoDetailModal
								onClose={() => closeModal(modalId)}
								signature={signature}
								creationDateFromMailHeaders={creationDateFromHeaders}
								messageIdFromMailHeaders={messageIdFromHeaders}
								isFromDistributionList={fromDistributionList}
								isFromExternalDomain={fromExternalDomain}
							/>
						</StoreProvider>
					)
				},
				true
			);
		},
		[
			closeModal,
			createModal,
			creationDateFromHeaders,
			messageIdFromHeaders,
			fromDistributionList,
			fromExternalDomain,
			signature
		]
	);

	if (
		!messageIdFromHeaders &&
		!creationDateFromHeaders &&
		!signature &&
		!fromExternalDomain &&
		!sensitivity &&
		!authenticationHeaders &&
		!fromDistributionList
	) {
		return <></>;
	}

	return (
		<Container orientation="horizontal" padding={{ all: 'small' }} mainAlignment="flex-start">
			<SmimeIcon signature={signature} />
			<ExternalDomainIcon fromExternalDomain={fromExternalDomain} />
			<MailSensitivityIcon sensitivity={sensitivity} />
			<MailAuthenticationHeaderIcon mailAuthenticationHeaders={authenticationHeaders} />
			<DistributionListIcon isDistributionList={fromDistributionList} />
			<Link size="medium" onClick={showMailDetailsModal}>
				{t('label.show_details', 'Show Details')}
			</Link>
		</Container>
	);
};
