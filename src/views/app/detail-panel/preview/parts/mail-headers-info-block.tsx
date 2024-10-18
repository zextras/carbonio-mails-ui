/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback } from 'react';

import { Container, Icon, Link, Row, Tooltip, useModal } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { SmimeDetailsModal } from './smime-details-modal';
import { StoreProvider } from '../../../../../store/redux';
import { IncompleteMessage } from '../../../../../types';
import {
	getMailSensitivityIconColor,
	getMailSensitivityLabelFallbackText,
	getSignedIconColor
} from '../utils';

type MailHeaderInfoProps = {
	msg: IncompleteMessage;
};

export const MailHeaderInfoBlock: FC<MailHeaderInfoProps> = ({ msg }): ReactElement => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();

	const signature = msg?.signature?.[0];
	const fromExternalDomain = msg?.isFromExternalDomain;
	const sensitivity = msg?.sensitivity;

	const onSmimeClick = useCallback(() => {
		const modalId = Date.now().toString();
		signature &&
			createModal(
				{
					id: modalId,
					maxHeight: '90vh',
					children: (
						<StoreProvider>
							<SmimeDetailsModal onClose={(): void => closeModal(modalId)} signature={signature} />
						</StoreProvider>
					)
				},
				true
			);
	}, [closeModal, createModal, signature]);

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
							icon={'AlertTriangleOutline'}
							color="warning"
							style={{ paddingRight: '0.5rem' }}
						/>
					</Row>
				</Tooltip>
			)}

			{/* Mail Sensitivity Information */}
			{sensitivity && (
				<Tooltip
					label={t(
						'label.mail_sensitivity',
						getMailSensitivityLabelFallbackText(sensitivity ?? 'Personal')
					)}
				>
					<Row>
						<Icon
							size="medium"
							icon={'AlertTriangleOutline'}
							color={getMailSensitivityIconColor(sensitivity ?? 'Personal')}
							style={{ paddingRight: '0.5rem' }}
						/>
					</Row>
				</Tooltip>
			)}

			{/* TODO: make this modal general and not S-MIME SPECIFIC */}
			<Link size="medium" onClick={onSmimeClick}>
				{t('label.show_details', 'Show Details')}
			</Link>
		</Container>
	);
};
