/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container, Link, Padding, useModal, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { DistributionListIcon } from './distribution-list-icon';
import { ExternalDomainIcon } from './external-domain-icon';
import { MailSensitivityIcon } from './mail-sensitivity-icon';
import { SmimeIcon } from './smime-icon';
import { checkExistEncryptionPassword } from '../../../../../../api/check-exist-password-api';
import { useSmimePasswordStore } from '../../../../../../store/certificates/store';
import { getMessageEmailStoreAction } from '../../../../../../store/emails/actions/get-message';
import { IncompleteMessage } from '../../../../../../types';
import { EnterPasswordModal } from '../../../../../settings/certificates/enter-password-modal';
import { MailInfoDetailModal } from '../info-details-modal/mail-info-detail-modal';

type MailInfoProps = {
	msg: IncompleteMessage;
};

export const MailInfoBlock = ({ msg }: MailInfoProps): React.JSX.Element | null => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();
	const { smimePassword } = useSmimePasswordStore();
	const createSnackbar = useSnackbar();

	const signature = msg.signature?.[0];
	const creationDateFromHeaders = msg.creationDateFromMailHeaders;
	const messageIdFromHeaders = msg.messageIdFromMailHeaders;
	const fromDistributionList = msg.messageIsFromDistributionList;
	const fromExternalDomain = msg.messageIsFromExternalDomain;
	const sensitivityHeader = msg.sensitivity;
	// const authenticationMailsHeaders = msg.authenticationHeaders;

	const showMailDetailsModal = useCallback(
		(event: React.MouseEvent): void => {
			event.stopPropagation();

			const modalId = 'mail-details-modal';
			createModal(
				{
					id: modalId,
					maxHeight: '90vh',
					children: (
						<MailInfoDetailModal
							onClose={(): void => closeModal(modalId)}
							signature={signature}
							creationDateFromMailHeaders={creationDateFromHeaders}
							messageIdFromMailHeaders={messageIdFromHeaders}
							messageIsFromDistributionList={fromDistributionList}
							messageIsFromExternalDomain={fromExternalDomain}
							// authenticationMailsHeaders={authenticationMailsHeaders}
							sensitivityValue={sensitivityHeader}
						/>
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
			sensitivityHeader,
			closeModal
		]
	);

	const dencryptMessage = useCallback(
		(event: React.MouseEvent): void => {
			event.stopPropagation();
			if (smimePassword !== '') {
				getMessageEmailStoreAction(msg.id, smimePassword);
			} else {
				checkExistEncryptionPassword().then((res) => {
					if ('data' in res) {
						const id = Date.now().toString();
						createModal(
							{
								id,
								size: 'medium',
								children: (
									<Container crossAlignment="baseline">
										<EnterPasswordModal
											onConfirm={(password): void => {
												getMessageEmailStoreAction(msg.id, password);
											}}
											onClose={(): void => closeModal?.(id)}
											hideReset
										/>
									</Container>
								)
							},
							true
						);
					} else {
						createSnackbar({
							key: `info-on-password-missing`,
							replace: true,
							severity: 'info',
							label: t(
								'settings.uploadCertificate.createPasswordFromSettings',
								'Please create your encryption password from settings'
							),
							autoHideTimeout: 3000,
							hideButton: true
						});
					}
				});
			}
		},
		[closeModal, createModal, createSnackbar, msg.id, smimePassword, t]
	);

	const showInfoDetails =
		!!messageIdFromHeaders ||
		!!creationDateFromHeaders ||
		signature ||
		fromExternalDomain ||
		sensitivityHeader ||
		// authenticationMailsHeaders ||
		fromDistributionList;

	return (
		<Container orientation="horizontal" padding={{ all: 'small' }} mainAlignment="flex-start">
			{signature && <SmimeIcon signature={signature} />}
			{fromExternalDomain && <ExternalDomainIcon />}
			{sensitivityHeader && <MailSensitivityIcon sensitivity={sensitivityHeader} />}
			{/* {authenticationMailsHeaders && ( */}
			{/* 	<MailAuthenticationHeaderIcon authenticationInfo={authenticationMailsHeaders} /> */}
			{/* )} */}
			{fromDistributionList && <DistributionListIcon />}
			{showInfoDetails && (
				<Link size="medium" onClick={showMailDetailsModal}>
					{t('label.show_details', 'Show Details')}
				</Link>
			)}
			{msg.isEncrypted && (
				<>
					<Padding right="small" />
					<Link size="medium" onClick={dencryptMessage}>
						{t('label.decrypt_message', 'Decrypt Message')}
					</Link>
				</>
			)}
		</Container>
	);
};
