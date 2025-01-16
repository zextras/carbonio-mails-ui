/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Button, Container, Table, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ModalFooter from '../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../carbonio-ui-commons/components/modals/modal-header';
import { deletePersonalCertificate } from '../../../store/actions/delete-personal-certificate-action';
import { usePasswordStore } from '../../../store/zustand/certificates/store';
import { Certificate } from '../../../types/certificates';

type EnterPasswordModalPropType = {
	certificates: Certificate[];
	onClose: () => void;
};
export const ShowAllCertificatesModal = ({
	certificates,
	onClose
}: EnterPasswordModalPropType): React.JSX.Element => {
	const [t] = useTranslation();
	const createSnackbar = useSnackbar();
	const { password } = usePasswordStore();
	const modalHeaderTitle = `Perosnal Cetificates of ${certificates[0].email}`; // t('settings.certificatePassword.enter_password', 'Enter password');

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

	const deleteCertificate = useCallback(
		(certificate: Certificate) => {
			console.log('===>> Delete certificate;;>>', certificate);
			deletePersonalCertificate(certificate.id, password).then((res) => {
				if ('data' in res) {
					usePasswordStore.getState().updatePassword(password);
					createSnackbar({
						key: `error-on-certificate-upload`,
						replace: true,
						severity: 'success',
						label: 'Certificate deleted successfully',
						autoHideTimeout: 3000,
						hideButton: true
					});
				} else {
					usePasswordStore.getState().updatePassword('');
					createSnackbar({
						key: `error-on-certificate-upload`,
						replace: true,
						severity: 'error',
						label: 'Failed to delete certificate',
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		},
		[createSnackbar, password]
	);

	const items = certificates.map((certificate: Certificate, index: number) => ({
		id: index.toString(),
		columns: [
			certificate.issuer,
			new Date(certificate.notBefore).toLocaleString(),
			new Date(certificate.notAfter).toLocaleString(),
			((): string => {
				if (certificate.selected) return 'Active';
				if (certificate.notAfter > Date.now()) return 'Deactive';
				return 'Expired';
			})(),
			certificate.serial,
			<Container key={index}>
				<Button
					icon="Trash2Outline"
					onClick={(): void => {
						console.log('===>> Delete certificate;;>>', certificate);
						// deleteCertificate(certificate);
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
