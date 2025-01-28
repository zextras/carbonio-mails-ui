/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useEffect, useState } from 'react';

import {
	Button,
	Container,
	FormSubSection,
	Padding,
	Table,
	Text,
	useModal,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { CertificateUploadModal } from './certificate-upload-modal';
import { ShowAllCertificatesModal } from './show-all-certificates-modal';
import { getPersonalCertificates } from '../../../api/get-personal-certificates-action';
import { uploadPersonalCertificate } from '../../../api/upload-personal-certificate-action';
import { PersonalCertificate, useSmimePasswordStore } from '../../../store/certificates/store';
import { Certificate } from '../../../types/certificates/certificates';

const PersonalCertificatesSettings: FC = (): ReactElement => {
	const [certificates, setCertificates] = useState<Certificate[]>([]);

	const { createModal, closeModal } = useModal();
	const id = Date.now().toString();
	const { smimePassword } = useSmimePasswordStore();
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const headers = [
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

	const loadPersonalCertificates = useCallback(() => {
		getPersonalCertificates().then((res) => {
			if ('data' in res) {
				setCertificates(res.data);
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

	const showAllCertificate = useCallback(
		(certificate: Certificate[]): void => {
			closeModal && closeModal(id);
			createModal(
				{
					id,
					size: 'large',
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
		(certificate: PersonalCertificate) => {
			uploadPersonalCertificate(certificate, smimePassword, true).then((res) => {
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
					loadPersonalCertificates();
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
		[createSnackbar, loadPersonalCertificates, smimePassword, t]
	);

	const onUploadCertificate = useCallback(() => {
		createModal(
			{
				id,
				size: 'medium',
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

	const items = certificates.map((certificate: Certificate, index) => ({
		id: index.toString(),
		columns: [
			certificate.email,
			certificate.issuer,
			new Date(certificate.notBefore).toLocaleString(),
			new Date(certificate.notAfter).toLocaleString(),
			((): string => {
				if (certificate.selected) return t('settings.uploadCertificate.active', 'Active');
				if (certificate.notAfter > Date.now())
					return t('settings.uploadCertificate.deactive', 'Deactive');
				return t('settings.uploadCertificate.expired', 'Expired');
			})(),
			certificate.serial
		],
		onClick: (): void => {
			getPersonalCertificates(certificate.email).then((res) => {
				if ('data' in res) {
					showAllCertificate(res.data);
				} else {
					createSnackbar({
						key: `error-on-get-certificate`,
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
		},
		clickable: true
	}));
	return (
		<>
			<FormSubSection
				label={t(
					'settings.uploadCertificate.personalCertificatesTitle',
					'Personal certificates for signing, encryption and decryption'
				)}
				id={'personal-certificates'}
				padding={{ all: 'large' }}
			>
				<Table rows={items} headers={headers} showCheckbox multiSelect={false} />
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
				<Padding all="large" />
				<Button
					onClick={(): void => onUploadCertificate()}
					label={t('settings.uploadCertificate.uploadCertificate', 'Upload Certificate')}
				/>
			</FormSubSection>
		</>
	);
};

export default PersonalCertificatesSettings;
