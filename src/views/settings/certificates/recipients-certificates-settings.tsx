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
	Table,
	useModal
} from '@zextras/carbonio-design-system';

import { CertificatePasswordModal } from './certificate-password-modal';
import { EnterPasswordModal } from './enter-password-modal';
import { getRecipientsCertificates } from '../../../store/actions/get-recipient-certificates-action';
import type { AccountIdentity, IdentityProps } from '../../../types';

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
	const [certificates, setCertificates] = useState([]);
	const id = Date.now().toString();
	const onPasswordConfirm = useCallback((password: string) => {
		console.log('===>> onPasswordConfirm called');
	}, []);

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

	useEffect(() => {
		getRecipientsCertificates().then((res) => {
			setRecipientsCertificatesData(res);
		});
	}, [setRecipientsCertificatesData]);

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

	return (
		<>
			<FormSubSection
				label="Recipients certificates for encryption"
				id={''}
				padding={{ all: 'large' }}
			>
				<Table rows={items} headers={headers} showCheckbox={false} multiSelect={false} />
			</FormSubSection>

			{/* This is temporary buttons to open password modal */}
			{/* <Padding top={'extralarge'} />
			<Padding top={'extralarge'} />
			<Padding top={'extralarge'} />
			<Padding top={'extralarge'} />
			<FormSubSection label="Password for S/MIME operations" id={''} padding={{ all: 'large' }}>
				<Container crossAlignment="flex-start" orientation="horizontal" padding={{ all: 'medium' }}>
					<Button onClick={(): void => onCertificatePassword()} label="Create Password" />
					<Padding all="medium" />
					<Button onClick={(): void => onEnterPassword()} label="Enter Password" />
					<Padding all="medium" />
					<Button onClick={(): void => onCertificatePassword(true)} label="Reset Password" />
				</Container>
			</FormSubSection> */}
		</>
	);
};

export default RecipientsCertificateSettings;
