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
	useModal
} from '@zextras/carbonio-design-system';

import { CertificateUploadModal } from './certificate-upload-modal';
import { ShowAllCertificatesModal } from './show-all-certificates-modal';
import { getPersonalCertificates } from '../../../store/actions/get-personal-certificates-action';
import { uploadPersonalCertificate } from '../../../store/actions/upload-personal-certificate-action';
import { Certificate, usePasswordStore } from '../../../store/zustand/certificates/store';
import type { AccountIdentity, IdentityProps } from '../../../types';

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
	const [certificates, setCertificates] = useState([]);

	const { createModal, closeModal } = useModal();
	const id = Date.now().toString();
	const { password } = usePasswordStore();

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
							/>
						</Container>
					)
				},
				true
			);
		},
		[closeModal, createModal, id]
	);

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
	const setPersonalCertificatesData = useCallback((res: any) => {
		if ('data' in res) {
			setCertificates(res.data);
		} else {
			// Error
		}
	}, []);

	const onCertificateUploadConfirm = useCallback(
		(certificate: Certificate) => {
			console.log('==== onCertificateUploadConfirm::>>', { certificate });
			uploadPersonalCertificate(certificate, password, false).then((res) => {
				console.log('==== onCertificateUploadConfirm::>>', { res });
				// return res;
			});
		},
		[password]
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
		getPersonalCertificates().then((res) => {
			setPersonalCertificatesData(res);
		});
	}, [setPersonalCertificatesData]);

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
			// Add your onClick logic here
			console.log('==== Row clicked::>>', { email: certificate.email });
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
