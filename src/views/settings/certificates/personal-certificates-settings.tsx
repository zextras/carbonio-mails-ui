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

import { CertificateUploadModal } from './certificate-upload-modal';
import { ShowAllCertificatesModal } from './show-all-certificates-modal';
import { getPersonalCertificates } from '../../../store/actions/get-personal-certificates-action';
import { uploadPersonalCertificate } from '../../../store/actions/upload-personal-certificate-action';
import {
	PersonalCertificate,
	useSmimePasswordStore
} from '../../../store/zustand/certificates/store';
import type { AccountIdentity, IdentityProps } from '../../../types';
import { Certificate } from '../../../types/certificates';

type PersonalCertificatesSettingsPropsType = {
	updatedIdentities?: AccountIdentity[];
	updateIdentities?: (arg: {
		target?: {
			name: string;
			value: string;
		};
		_attrs?: IdentityProps;
	}) => void;
};

const PersonalCertificatesSettings: FC<PersonalCertificatesSettingsPropsType> = ({
	updatedIdentities,
	updateIdentities
}): ReactElement => {
	const [certificates, setCertificates] = useState<Certificate[]>([]);

	const { createModal, closeModal } = useModal();
	const id = Date.now().toString();
	const { smimePassword } = useSmimePasswordStore();
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
			id: 'serial',
			label: 'Serial',
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

	const showAllCertificate = useCallback(
		(certificate: any): void => {
			closeModal && closeModal(id);
			createModal(
				{
					id,
					size: 'large',
					children: (
						<Container crossAlignment="baseline">
							<ShowAllCertificatesModal
								certificates={certificate}
								onClose={(): void => closeModal?.(id)}
								onCertificateUpdate={(): void => {
									loadPersonalCertificates();
									console.log('===>> onCertificateUpdate called');
								}}
							/>
						</Container>
					)
				},
				true
			);
		},
		[closeModal, createModal, id]
	);

	const onCertificateUploadConfirm = useCallback(
		(certificate: PersonalCertificate) => {
			console.log('==== onCertificateUploadConfirm::>>', { certificate });
			uploadPersonalCertificate(certificate, smimePassword, false).then((res) => {
				if ('data' in res) {
					createSnackbar({
						key: `error-on-certificate-upload`,
						replace: true,
						severity: 'success',
						label: 'Certificate uploaded successfully',
						autoHideTimeout: 3000,
						hideButton: true
					});
					loadPersonalCertificates();
				} else {
					useSmimePasswordStore.getState().updateSmimePassword('');
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
		[createSnackbar, loadPersonalCertificates, smimePassword]
	);

	const onUploadCertificate = useCallback(() => {
		console.log('==== onUploadCertificate::>>');
		const id = Date.now().toString();
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
	}, [closeModal, createModal, onCertificateUploadConfirm]);

	useEffect(() => {
		loadPersonalCertificates();
	}, [loadPersonalCertificates]);

	const items = certificates.map((certificate: any, index) => ({
		id: index.toString(),
		columns: [
			certificate.email,
			certificate.issuer,
			new Date(certificate.notBefore).toLocaleString(),
			new Date(certificate.notAfter).toLocaleString(),
			certificate.notAfter > Date.now() ? 'Active' : 'Expired',
			certificate.serial
		],
		onClick: (e: React.MouseEvent<HTMLTableRowElement>): void => {
			getPersonalCertificates(certificate.email).then((res) => {
				if ('data' in res) {
					showAllCertificate(res.data);
				} else {
					// Error
				}
			});
		},
		clickable: true
	}));
	return (
		<>
			<FormSubSection
				label="Personal certificates for signing and encryption"
				id={''}
				padding={{ all: 'large' }}
			>
				<Table rows={items} headers={headers} showCheckbox multiSelect={false} />
				<Padding all="large" />
				<Button onClick={(): void => onUploadCertificate()} label="Upload Certificate" />
			</FormSubSection>
		</>
	);
};

export default PersonalCertificatesSettings;
