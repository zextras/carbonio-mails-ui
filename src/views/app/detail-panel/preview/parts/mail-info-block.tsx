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
	getIsSensitive,
	getMailAuthenticationHeaderLabel,
	getMailSensitivityIconColor,
	getMailSensitivityLabel
} from '../../../../../normalizations/mail-header-utils';
import { StoreProvider } from '../../../../../store/redux';
import { IncompleteMessage } from '../../../../../types';
import { getSignedIconColor } from '../utils';

type MailInfoProps = {
	msg: IncompleteMessage;
};

export const MailInfoBlock: FC<MailInfoProps> = ({ msg }): ReactElement => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();

	const signature = msg?.signature?.[0];
	const fromExternalDomain = msg?.isFromExternalDomain;
	const sensitive = getIsSensitive(msg?.sensitivity);
	const sensitivity = msg?.sensitivity;
	const hasAuthenticationHeaders = getHasAuthenticationHeaders(msg?.authenticatonHeaders);
	const authenticationHeadersIconColor = getAuthenticationHeadersIcon(msg?.authenticatonHeaders);
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

			{/* External Domain Information */}
			{fromExternalDomain && (
				<Tooltip label={t('label.from_external_domain', 'Mail from external domain')}>
					<Row>
						<Icon
							size="medium"
							icon={'MailStatusOutline'}
							color="warning"
							style={{ paddingRight: '0.5rem' }}
						/>
					</Row>
				</Tooltip>
			)}

			{/* Mail Sensitivity Information */}
			{sensitive && (
				<Tooltip label={getMailSensitivityLabel(t, sensitivity)}>
					<Row>
						<Icon
							size="medium"
							icon={'EyeOff2Outline'}
							color={getMailSensitivityIconColor(sensitivity ?? 'Personal')}
							style={{ paddingRight: '0.5rem' }}
						/>
					</Row>
				</Tooltip>
			)}

			{/* Mail AuthenticationHeaders Information */}
			{hasAuthenticationHeaders && (
				<Tooltip label={getMailAuthenticationHeaderLabel(t, msg.authenticatonHeaders)}>
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
