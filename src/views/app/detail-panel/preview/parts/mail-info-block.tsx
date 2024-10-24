/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container, Link, useModal } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { DistributionListIcon } from './distribution-list-icon';
import { ExternalDomainIcon } from './external-domain-icon';
import { MailInfoDetailModal } from './info-details-modal/mail-info-detail-modal';
import { MailAuthenticationHeaderIcon } from './mail-authentication-header-icon';
import { MailSensitivityIcon } from './mail-sensitivity-icon';
import { SmimeIcon } from './smime-icon';
import {
	getHasAuthenticationHeaders,
	getIsSensitive
} from '../../../../../normalizations/mail-header-utils';
import { StoreProvider } from '../../../../../store/redux';
import { IncompleteMessage } from '../../../../../types';

type MailInfoProps = {
	msg: IncompleteMessage;
};

export const MailInfoBlock = ({ msg }: MailInfoProps): React.JSX.Element | null => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();

	const signature = msg?.signature?.[0];
	const creationDateFromHeaders = msg?.creationDateFromMailHeaders;
	const messageIdFromHeaders = msg?.messageIdFromMailHeaders;
	const fromDistributionList = msg?.messageIsFromDistributionList;
	const fromExternalDomain = msg?.messageIsFromExternalDomain;
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
								onClose={(): void => closeModal(modalId)}
								signature={signature}
								creationDateFromMailHeaders={creationDateFromHeaders}
								messageIdFromMailHeaders={messageIdFromHeaders}
								messageIsFromDistributionList={fromDistributionList}
								messageIsFromExternalDomain={fromExternalDomain}
								mailAuthenticationHeaders={authenticationHeaders}
								sensitivityValue={sensitivity}
							/>
						</StoreProvider>
					)
				},
				true
			);
		},
		[
			createModal,
			signature,
			creationDateFromHeaders,
			messageIdFromHeaders,
			fromDistributionList,
			fromExternalDomain,
			authenticationHeaders,
			sensitivity,
			closeModal
		]
	);

	const isSensitive = getIsSensitive(sensitivity);
	const hasAuthenticationHeaders = getHasAuthenticationHeaders(authenticationHeaders);

	const showLink =
		messageIdFromHeaders ||
		creationDateFromHeaders ||
		signature ||
		fromExternalDomain ||
		isSensitive ||
		hasAuthenticationHeaders ||
		fromDistributionList;

	return (
		<Container orientation="horizontal" padding={{ all: 'small' }} mainAlignment="flex-start">
			{signature && <SmimeIcon signature={signature} />}
			{fromExternalDomain && <ExternalDomainIcon />}
			{isSensitive && <MailSensitivityIcon sensitivity={sensitivity} />}
			{hasAuthenticationHeaders && (
				<MailAuthenticationHeaderIcon mailAuthenticationHeaders={authenticationHeaders} />
			)}
			{fromDistributionList && <DistributionListIcon />}
			{showLink && (
				<Link size="medium" onClick={showMailDetailsModal}>
					{t('label.show_details', 'Show Details')}
				</Link>
			)}
		</Container>
	);
};
