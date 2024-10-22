/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback } from 'react';

import { Container, Icon, Link, Row, Tooltip, useModal } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MailInfoDetailModal } from './info-details-modal/mail-info-detail-modal';
import {
	getAuthenticationHeadersIcon,
	getHasAuthenticationHeaders,
	getMailAuthenticationHeaderLabel
} from '../../../../../normalizations/mail-header-utils';
import { StoreProvider } from '../../../../../store/redux';
import { IncompleteMessage } from '../../../../../types';
import { getSignedIconColor } from '../utils';
import { ExternalDomainIcon } from './external-domain-icon';
import { MailSensitivityIcon } from './mail-sensitivity-icon';

type MailInfoProps = {
	msg: IncompleteMessage;
};

export const MailInfoBlock: FC<MailInfoProps> = ({ msg }): ReactElement => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();

	const signature = msg?.signature?.[0];
	const fromExternalDomain = msg?.isFromExternalDomain;
	const sensitivity = msg?.sensitivity;
	const hasAuthenticationHeaders = getHasAuthenticationHeaders(msg?.authenticationHeaders);
	const authenticationHeadersIconColor = getAuthenticationHeadersIcon(msg?.authenticationHeaders);
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
			{/* S-MIME Signature Information */}
			{signature && (
				<Tooltip
					label={
						signature?.valid
							? t('label.valid_signature', 'Valid Signature')
							: t('label.invalid_signature', 'Invalid Signature')
					}
				>
					<Row>
						<Icon
							size="medium"
							icon={'SignatureOutline'}
							color={getSignedIconColor(signature?.messageCode ?? '')}
							style={{ alignSelf: 'center', paddingRight: '0.5rem' }}
						/>
					</Row>
				</Tooltip>
			)}

			<ExternalDomainIcon fromExternalDomain={fromExternalDomain} />
			<MailSensitivityIcon sensitivity={sensitivity} />

			{/* Mail AuthenticationHeaders Information */}
			{hasAuthenticationHeaders && (
				<Tooltip label={getMailAuthenticationHeaderLabel(t, msg.authenticationHeaders)}>
					<Row>
						<Icon
							size="medium"
							icon={'ShieldOutline'}
							color={authenticationHeadersIconColor}
							style={{ paddingRight: '0.5rem' }}
						/>
					</Row>
				</Tooltip>
			)}
			<Link size="medium" onClick={onClick}>
				{t('label.show_details', 'Show Details')}
			</Link>
		</Container>
	);
};
