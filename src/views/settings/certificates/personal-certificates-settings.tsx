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
	useModal,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getPersonalCertificates } from 'api/get-personal-certificates-api';
import { uploadPersonalCertificate } from 'api/upload-personal-certificate-api';
import { PersonalCertificate, useSmimePasswordStore } from 'store/certificates/store';
import { Certificate } from 'types/certificates/certificates';
import { CertificateUploadModal } from 'views/settings/certificates/certificate-upload-modal';
import ShowAllCertificatesModal from 'views/settings/certificates/show-all-certificates-modal';

const PersonalCertificatesSettings: FC = (): ReactElement => {
	const [certificates, setCertificates] = useState<Certificate[]>([]);

	const { createModal, closeModal } = useModal();
	const id = Date.now().toString();
	const { smimePassword } = useSmimePasswordStore();
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const personalCertificateHeaders = [
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
			id: 'serial',
			label: t('settings.uploadCertificate.serial', 'Serial'),
			width: '20%',
			bold: true
		}
	];
	const showSnackbar = useCallback(
		(severity: 'error' | 'success', message: string) => {
			createSnackbar({
				key: `certificate-action-${severity}`,
				replace: true,
				severity,
				label: message,
				autoHideTimeout: 3000,
				hideButton: true
			});
		},
		[createSnackbar]
	);
	const loadPersonalCertificates = useCallback(() => {
		getPersonalCertificates().then((res) => {
			if ('data' in res) {
				setCertificates(res.data);
			} else {
				showSnackbar(
					'error',
					t(
						'settings.uploadCertificate.errorWhileFetchingCert',
						'Error while fetching certificates'
					)
				);
			}
		});
	}, [showSnackbar, t]);

	const showAllCertificate = useCallback(
		(certificate: Certificate[]): void => {
			closeModal && closeModal(id);
			createModal(
				{
					id,
					size: 'large',
					onClose: (): void => {
						closeModal?.(id);
					},
					children: (
						<Container crossAlignment="baseline">
							<ShowAllCertificatesModal
								certificates={certificate}
								onClose={(isUpdateList): void => {
									if (isUpdateList) {
										loadPersonalCertificates();
									}
									closeModal?.(id);
								}}
								createModal={createModal}
								closeModal={closeModal}
							/>
						</Container>
					)
				},
				true
			);
		},
		[closeModal, createModal, id, loadPersonalCertificates]
	);

	const onCertificateUploadConfirm = useCallback(
		(certificate: PersonalCertificate, isSelected?: boolean) => {
			uploadPersonalCertificate(certificate, smimePassword, isSelected).then((res) => {
				if ('data' in res) {
					showSnackbar(
						'success',
						t(
							'settings.uploadCertificate.certtificateUploaded',
							'Certificate uploaded successfully'
						)
					);
					loadPersonalCertificates();
				} else {
					showSnackbar(
						'error',
						t(
							'settings.uploadCertificate.errorWhileUploadCert',
							'Error while uploading certificate'
						)
					);
				}
			});
		},
		[loadPersonalCertificates, showSnackbar, smimePassword, t]
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
						<CertificateUploadModal
							onConfirm={onCertificateUploadConfirm}
							onClose={(): void => closeModal?.(id)}
						/>
					</Container>
				)
			},
			true
		);
	}, [closeModal, createModal, id, onCertificateUploadConfirm]);

	useEffect(() => {
		loadPersonalCertificates();
	}, [loadPersonalCertificates]);

	const items = certificates.map((certificate: Certificate, index) => {
		let certificateStatus = '';

		// Determining certificate status
		if (certificate.selected) {
			certificateStatus = t('settings.uploadCertificate.active', 'Active');
		} else if (certificate.notAfter > Date.now()) {
			certificateStatus = t('settings.uploadCertificate.inactive', 'Inactive');
		} else {
			certificateStatus = t('settings.uploadCertificate.expired', 'Expired');
		}

		return {
			id: index.toString(),
			columns: [
				certificate.email,
				certificate.issuer,
				new Date(certificate.notBefore).toLocaleString(),
				new Date(certificate.notAfter).toLocaleString(),
				certificateStatus,
				certificate.serial
			],
			onClick: (): void => {
				getPersonalCertificates(certificate.email).then((res) => {
					if ('data' in res) {
						showAllCertificate(res.data);
					} else {
						showSnackbar(
							'error',
							t(
								'settings.uploadCertificate.errorWhileFetchingCert',
								'Error while fetching certificates'
							)
						);
					}
				});
			},
			clickable: true
		};
	});

	return (
		<FormSection
			id={'personal-certificates'}
			label={t(
				'settings.uploadCertificate.personalCertificatesTitle',
				'Personal certificates for signing, encryption and decryption'
			)}
		>
			<FormSubSection>
				<Container gap={'2rem'} mainAlignment={'flex-start'} crossAlignment={'flex-start'}>
					<Container>
						<Table
							rows={items}
							headers={personalCertificateHeaders}
							showCheckbox
							multiSelect={false}
						/>
						{items.length === 0 && (
							<Container padding={{ vertical: 'large' }}>
								<Text>
									{t(
										'settings.uploadCertificate.noPersonalCertificate',
										'Personal certificate list is empty'
									)}
								</Text>
							</Container>
						)}
					</Container>
					<Button
						onClick={(): void => onUploadCertificate()}
						label={t('settings.uploadCertificate.uploadCertificate', 'Upload Certificate')}
						data-testid="upload-personal-certificate-btn"
					/>
				</Container>
			</FormSubSection>
		</FormSection>
	);
};

export default PersonalCertificatesSettings;
