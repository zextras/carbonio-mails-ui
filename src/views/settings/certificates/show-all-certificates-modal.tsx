/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useState } from 'react';

import { Button, Container, Table } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ModalFooter from '../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../carbonio-ui-commons/components/modals/modal-header';
import { getPersonalCertificates } from '../../../store/actions/get-personal-certificates-action';

type EnterPasswordModalPropType = {
	certificate: any;
	onClose: () => void;
};
export const ShowAllCertificatesModal = ({
	certificate,
	onClose
}: EnterPasswordModalPropType): React.JSX.Element => {
	const [t] = useTranslation();
	const [certificates, setCertificates] = useState([]);
	const modalHeaderTitle = 'Perosnal Cetificates'; // t('settings.certificatePassword.enter_password', 'Enter password');

	const headers = [
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
		},
		{
			id: 'action',
			label: '',
			width: '20%'
		}
	];
	const setPersonalCertificatesData = useCallback((res: any) => {
		if ('data' in res) {
			setCertificates(res.data);
		} else {
			// Error
		}
	}, []);

	useEffect(() => {
		getPersonalCertificates().then((res) => {
			setPersonalCertificatesData(res);
		});
	}, [setPersonalCertificatesData]);

	const items = certificates.map((certificate: any, index) => ({
		id: index.toString(),
		columns: [
			// certificate.email,
			certificate.issuer,
			new Date(certificate.notBefore).toLocaleString(),
			new Date(certificate.notAfter).toLocaleString(),
			certificate.notAfter > Date.now() ? 'Active' : 'Expired',
			certificate.serial,
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

	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<ModalHeader onClose={onClose} title={modalHeaderTitle} />
			<Container padding={{ all: 'small' }} crossAlignment="flex-start" height="fit">
				<Table rows={items} headers={headers} showCheckbox multiSelect={false} />
				<ModalFooter onConfirm={onClose} label={t('label.close', 'Close')} />
			</Container>
		</Container>
	);
};
