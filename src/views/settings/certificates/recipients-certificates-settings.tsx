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
	useModal,
	useSnackbar
} from '@zextras/carbonio-design-system';

import { CertificatePasswordModal } from './certificate-password-modal';
import { EnterPasswordModal } from './enter-password-modal';
import { RecipientsCertificateUploadModal } from './recipients-certificate-upload-modal';
import { getRecipientsCertificates } from '../../../store/actions/get-recipient-certificates-action';
import { uploadRecipientCertificate } from '../../../store/actions/upload-recipients-certificate-action';
import type { AccountIdentity, IdentityProps } from '../../../types';
import { Certificate } from '../../../types/certificates';

type RecipientsCertificateSettingsPropsType = {
	updatedIdentities?: AccountIdentity[];
	updateIdentities?: (arg: {
		target?: {
			name: string;
			value: string;
		};
		_attrs?: IdentityProps;
	}) => void;
};

const RecipientsCertificateSettings: FC<RecipientsCertificateSettingsPropsType> = ({
	updatedIdentities,
	updateIdentities
}): ReactElement => {
	const { createModal, closeModal } = useModal();
	const [certificates, setCertificates] = useState<Certificate[]>([]);
	const id = Date.now().toString();
	const onPasswordConfirm = useCallback((password: string) => {
		console.log('===>> onPasswordConfirm called');
	}, []);
	const createSnackbar = useSnackbar();

	const headers = [
		{
			id: 'email',
			label: 'Mail address',
			width: '20%',
			bold: true
		},
		{
			id: 'issuer',
			label: 'Issuer',
			width: '30%',
			bold: true
		},
		{
			id: 'validfrom',
			label: 'Valid From',
			width: '20%',
			bold: true
		},
		{
			id: 'validto',
			label: 'Valid To',
			width: '20%',
			bold: true
		},
		{
			id: 'status',
			label: 'Status',
			width: '20%',
			bold: true
		},
		{
			id: 'action',
			label: ''
		}
	];

	const setRecipientsCertificatesData = useCallback((res: any) => {
		if ('data' in res) {
			setCertificates(res.data.list);
		} else {
			// Error
		}
	}, []);

	const loadRecipientsCertificates = useCallback(() => {
		getRecipientsCertificates().then((res) => {
			console.log('==== loadRecipientsCertificates::>>', { res });
			if ('data' in res) {
				setCertificates(res.data.list);
			} else {
				createSnackbar({
					key: `error-on-certificate-upload`,
					replace: true,
					severity: 'error',
					label: 'Error loading certificates',
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
	}, [createSnackbar]);

	useEffect(() => {
		loadRecipientsCertificates();
	}, [loadRecipientsCertificates, setRecipientsCertificatesData]);

	const items = certificates.map((certificate: any, index) => ({
		id: index.toString(),
		columns: [
			certificate.email,
			certificate.issuer,
			new Date(certificate.notBefore).toLocaleString(),
			new Date(certificate.notAfter).toLocaleString(),
			certificate.notAfter > Date.now() ? 'Active' : 'Expired',
			<Container key={index}>
				<Button
					icon="Trash2Outline"
					onClick={(): void => {
						console.log('===>> Delete certificate;;>>', certificate);
					}}
					size="large"
					type="ghost"
				/>
			</Container>
		]
	}));

	const onCertificatePassword = useCallback(
		(isReset?: boolean): void => {
			createModal(
				{
					id,
					size: 'medium',
					children: (
						<Container crossAlignment="baseline">
							<CertificatePasswordModal
								isReset={isReset}
								onConfirm={onPasswordConfirm}
								onClose={(): void => closeModal?.(id)}
							/>
						</Container>
					)
				},
				true
			);
		},
		[closeModal, createModal, id, onPasswordConfirm]
	);

	const onEnterPassword = useCallback((): void => {
		createModal(
			{
				id,
				size: 'medium',
				children: (
					<Container crossAlignment="baseline">
						<EnterPasswordModal
							onPasswordReset={(): void => onCertificatePassword(true)}
							onConfirm={onPasswordConfirm}
							onClose={(): void => closeModal?.(id)}
						/>
					</Container>
				)
			},
			true
		);
	}, [closeModal, createModal, id, onCertificatePassword, onPasswordConfirm]);

	const onCertificateUploadConfirm = useCallback(
		(certificateContent: string | ArrayBuffer) => {
			uploadRecipientCertificate(certificateContent).then((res) => {
				console.log('==== onCertificateUploadConfirm::>>', { res });
				if ('data' in res) {
					createSnackbar({
						key: `error-on-certificate-upload`,
						replace: true,
						severity: 'success',
						label: 'Certificate uploaded successfully',
						autoHideTimeout: 3000,
						hideButton: true
					});
					loadRecipientsCertificates();
				} else {
					createSnackbar({
						key: `error-on-certificate-upload`,
						replace: true,
						severity: 'error',
						label: 'Error uploading certificate',
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		},
		[createSnackbar, loadRecipientsCertificates]
	);

	const onUploadCertificate = useCallback(() => {
		createModal(
			{
				id,
				size: 'medium',
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
		<>
			<FormSubSection
				label="Recipients certificates for encryption"
				id={''}
				padding={{ all: 'large' }}
			>
				<Table rows={items} headers={headers} showCheckbox={false} multiSelect={false} />
				<Padding all="large" />
				<Button onClick={(): void => onUploadCertificate()} label="Upload Certificate" />
			</FormSubSection>
		</>
	);
};

export default RecipientsCertificateSettings;
