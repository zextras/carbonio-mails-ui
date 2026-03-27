/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container, Link, Padding, useModal, useSnackbar } from '@zextras/carbonio-design-system';
import { getUserSettings, useIsCarbonioCE } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { checkExistEncryptionPassword } from 'api/check-exist-password-api';
import { useSmimeFeatureStore, useSmimePasswordStore } from 'store/certificates/store';
import { getMessageDecryptEmailStoreAction } from 'store/emails/actions/get-message';
import { IncompleteMessage } from 'types/messages';
import { DistributionListIcon } from 'views/app/detail-panel/preview/parts/info-block/distribution-list-icon';
import { ExternalDomainIcon } from 'views/app/detail-panel/preview/parts/info-block/external-domain-icon';
import { MailSensitivityIcon } from 'views/app/detail-panel/preview/parts/info-block/mail-sensitivity-icon';
import { SmimeIcon } from 'views/app/detail-panel/preview/parts/info-block/smime-icon';
import { MailInfoDetailModal } from 'views/app/detail-panel/preview/parts/info-details-modal/mail-info-detail-modal';
import { EnterPasswordModal } from 'views/settings/certificates/enter-password-modal';

type MailInfoProps = {
	msg: IncompleteMessage;
};

export const MailInfoBlock = ({ msg }: MailInfoProps): React.JSX.Element | null => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();
	const { smimePassword } = useSmimePasswordStore();
	const createSnackbar = useSnackbar();
	const isCarbonioCE = useIsCarbonioCE();
	const { isSmimeEnabled } = useSmimeFeatureStore();

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
					onClose: (): void => {
						closeModal(modalId);
					},
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

	const decryptMsgAction = useCallback(
		(msgId: string, password: string) => {
			const prefs = getUserSettings()?.prefs;
			const displayAsHtml = prefs?.zimbraPrefMessageViewHtmlPreferred === 'TRUE';
			getMessageDecryptEmailStoreAction(msgId, password, displayAsHtml).then((response) => {
				if (!response) {
					createSnackbar({
						key: `unable-to-decrypt`,
						replace: true,
						severity: 'error',
						label: t('settings.uploadCertificate.unableToDecrypt', 'Unable to decrypt'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		},
		[createSnackbar, t]
	);

	const dencryptMessage = useCallback(
		(event: React.MouseEvent): void => {
			event.stopPropagation();
			if (smimePassword !== '') {
				decryptMsgAction(msg.id, smimePassword);
			} else {
				checkExistEncryptionPassword().then((res) => {
					if ('data' in res) {
						const id = Date.now().toString();
						createModal(
							{
								id,
								size: 'medium',
								onClose: (): void => {
									closeModal?.(id);
								},
								children: (
									<Container crossAlignment="baseline">
										<EnterPasswordModal
											onConfirm={(password): void => decryptMsgAction(msg.id, password)}
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
							severity: 'error',
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
		[closeModal, createModal, createSnackbar, decryptMsgAction, msg.id, smimePassword, t]
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
			{msg.isEncrypted && isSmimeEnabled && !isCarbonioCE && (
				<>
					<Padding right="small" />
					<Link size="medium" onClick={dencryptMessage} data-testid="decrypt-message-link">
						{t('label.decrypt_message', 'Decrypt Message')}
					</Link>
				</>
			)}
		</Container>
	);
};
