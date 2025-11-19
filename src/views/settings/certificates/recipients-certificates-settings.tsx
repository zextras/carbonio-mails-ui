/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useEffect, useState } from 'react';

import {
	Button,
	Container,
	FormSection,
	FormSubSection,
	Table,
	Text,
	Tooltip,
	useModal,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { deleteRecipientCertificate } from 'api/delete-recipient-certificate-api';
import { getRecipientsCertificates } from 'api/get-recipient-certificates-api';
import { uploadRecipientCertificate } from 'api/upload-recipients-certificate-api';
import { Certificate } from 'types/certificates/certificates';
import CertificateDeleteModal from 'views/settings/certificates/certificate-delete-modal';
import { RecipientsCertificateUploadModal } from 'views/settings/certificates/recipients-certificate-upload-modal';

const RecipientsCertificateSettings: FC = (): ReactElement => {
	const { createModal, closeModal } = useModal();
	const [certificates, setCertificates] = useState<Certificate[]>([]);
	const id = Date.now().toString();

	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const recipientsCertificateHeaders = [
		{
			id: 'email',
			label: t('settings.uploadCertificate.mailAddress', 'Mail address'),
			width: '20%',
			bold: true
		},
		{
			id: 'issuer',
			label: t('settings.uploadCertificate.issuer', 'Issuer'),
			width: '30%',
			bold: true
		},
		{
			id: 'validfrom',
			label: t('settings.uploadCertificate.validFrom', 'Valid From'),
			width: '20%',
			bold: true
		},
		{
			id: 'validto',
			label: t('settings.uploadCertificate.validTo', 'Valid To'),
			width: '20%',
			bold: true
		},
		{
			id: 'status',
			label: t('settings.uploadCertificate.status', 'Status'),
			width: '20%',
			bold: true
		},
		{
			id: 'action',
			label: ''
		}
	];

	const loadRecipientsCertificates = useCallback(() => {
		getRecipientsCertificates().then((res) => {
			if ('data' in res) {
				setCertificates(res.data.list);
			} else {
				createSnackbar({
					key: `error-on-fetching-certificate`,
					replace: true,
					severity: 'error',
					label: t(
						'settings.uploadCertificate.errorWhileFetchingCert',
						'Error while fetching certificates'
					),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
	}, [createSnackbar, t]);

	useEffect(() => {
		loadRecipientsCertificates();
	}, [loadRecipientsCertificates]);

	const deleteCertificate = useCallback(
		(certificate: Certificate) => {
			deleteRecipientCertificate(certificate.email).then((res) => {
				if ('data' in res) {
					createSnackbar({
						key: `certificate-deleted`,
						replace: true,
						severity: 'success',
						label: t(
							'settings.uploadCertificate.certificateDeleted',
							'Certificate deleted successfully'
						),
						autoHideTimeout: 3000,
						hideButton: true
					});
					loadRecipientsCertificates();
				} else {
					createSnackbar({
						key: `error-on-certificate-delete`,
						replace: true,
						severity: 'error',
						label: t(
							'settings.uploadCertificate.certificateDeleteFailed',
							'Failed to delete certificate'
						),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		},
		[createSnackbar, loadRecipientsCertificates, t]
	);

	const items = certificates.map((certificate: Certificate, index) => ({
		id: index.toString(),
		columns: [
			certificate.email,
			certificate.issuer,
			new Date(certificate.notBefore).toLocaleString(),
			new Date(certificate.notAfter).toLocaleString(),
			certificate.notAfter > Date.now()
				? t('settings.uploadCertificate.active', 'Active')
				: t('settings.uploadCertificate.expired', 'Expired'),
			<Container key={certificate.email}>
				<Tooltip label={t('settings.uploadCertificate.deleteCertificate', 'Delete Certificate')}>
					<Button
						icon="Trash2Outline"
						onClick={(): void => {
							createModal(
								{
									id: index.toString(),
									size: 'small',
									onClose: (): void => {
										closeModal?.(index.toString());
									},
									children: (
										<CertificateDeleteModal
											onClose={(): void => closeModal?.(index.toString())}
											onConfirmDelete={(): void => {
												closeModal?.(index.toString());
												deleteCertificate(certificate);
											}}
											email={certificate.email}
										/>
									)
								},
								true
							);
						}}
						size="large"
						type="ghost"
						color={'error'}
					/>
				</Tooltip>
			</Container>
		]
	}));

	const onCertificateUploadConfirm = useCallback(
		(certificateContent: string | ArrayBuffer) => {
			uploadRecipientCertificate(certificateContent).then((res) => {
				if ('data' in res) {
					createSnackbar({
						key: `certificate-uploaded`,
						replace: true,
						severity: 'success',
						label: t(
							'settings.uploadCertificate.certtificateUploaded',
							'Certificate uploaded successfully'
						),
						autoHideTimeout: 3000,
						hideButton: true
					});
					loadRecipientsCertificates();
					closeModal?.(id);
				} else {
					createSnackbar({
						key: `error-on-certificate-upload`,
						replace: true,
						severity: 'error',
						label: t(
							'settings.uploadCertificate.errorWhileUploadCert',
							'Error while uploading certificate'
						),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		},
		[closeModal, createSnackbar, id, loadRecipientsCertificates, t]
	);

	const onUploadCertificate = useCallback(() => {
		createModal(
			{
				id,
				size: 'medium',
				onClose: (): void => {
					closeModal?.(id);
				},
				children: (
					<Container crossAlignment="baseline">
						<RecipientsCertificateUploadModal
							onConfirm={onCertificateUploadConfirm}
							onClose={(): void => closeModal?.(id)}
						/>
					</Container>
				)
			},
			true
		);
	}, [closeModal, createModal, id, onCertificateUploadConfirm]);

	return (
		<FormSection
			label={t(
				'settings.uploadCertificate.recipientCertificatesTitle',
				'Recipients certificates for encryption'
			)}
			id={'recipient-certificates'}
		>
			<FormSubSection>
				<Container gap={'2rem'} mainAlignment={'flex-start'} crossAlignment={'flex-start'}>
					<Container>
						<Table
							rows={items}
							headers={recipientsCertificateHeaders}
							showCheckbox={false}
							multiSelect={false}
						/>
						{items.length === 0 && (
							<Container padding={{ vertical: 'large' }}>
								<Text>
									{t(
										'settings.uploadCertificate.noRecipientCertificate',
										'Recipients certificate list is empty'
									)}
								</Text>
							</Container>
						)}
					</Container>
					<Button
						onClick={(): void => onUploadCertificate()}
						label={t('settings.uploadCertificate.uploadCertificate', 'Upload Certificate')}
						data-testid="upload-recipients-certificate-btn"
					/>
				</Container>
			</FormSubSection>
		</FormSection>
	);
};

export default RecipientsCertificateSettings;
