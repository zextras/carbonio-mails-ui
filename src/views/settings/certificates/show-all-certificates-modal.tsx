/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState } from 'react';

import { Button, Container, Table, Tooltip, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { deletePersonalCertificate } from '../../../api/delete-personal-certificate-action';
import { selectPersonalCertificate } from '../../../api/select-personal-certificate-action';
import ModalFooter from '../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../carbonio-ui-commons/components/modals/modal-header';
import { useSmimePasswordStore } from '../../../store/certificates/store';
import { Certificate } from '../../../types/certificates/certificates';

type EnterPasswordModalPropType = {
	certificates: Certificate[];
	onClose: (isUpdateList: boolean) => void;
};
export const ShowAllCertificatesModal = ({
	certificates,
	onClose
}: EnterPasswordModalPropType): React.JSX.Element => {
	const [t] = useTranslation();
	const createSnackbar = useSnackbar();
	const { smimePassword } = useSmimePasswordStore();
	const modalHeaderTitle = `${t('settings.uploadCertificate.personalCertificate', 'Personal Cetificates of')} ${certificates[0].email}`;

	const [selectedRows, setSelectedRows] = useState<string[]>([]);
	const [localCertificates, setLocalCertificates] = useState(certificates);
	const [isUpdateList, setIsUpdateList] = useState(false);
	const headers = [
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
		},
		{
			id: 'action',
			label: '',
			width: '20%'
		}
	];

	const deleteCertificate = useCallback(
		(certificate: Certificate) => {
			deletePersonalCertificate(certificate.id, smimePassword).then((res) => {
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
					setLocalCertificates((prevCertificates) =>
						prevCertificates.filter((cert) => cert.id !== certificate.id)
					);
					setIsUpdateList(true);
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
		[createSnackbar, smimePassword, t]
	);

	const items = localCertificates.map((certificate: Certificate, index: number) => ({
		id: index.toString(),
		columns: [
			certificate.issuer,
			new Date(certificate.notBefore).toLocaleString(),
			new Date(certificate.notAfter).toLocaleString(),
			((): string => {
				if (certificate.selected) return t('settings.uploadCertificate.active', 'Active');
				if (certificate.notAfter > Date.now())
					return t('settings.uploadCertificate.deactive', 'Deactive');
				return t('settings.uploadCertificate.expired', 'Expired');
			})(),
			certificate.serial,
			<Container key={certificate.email}>
				<Tooltip label={t('settings.uploadCertificate.deleteCertificate', 'Delete Certificate')}>
					<Button
						icon="Trash2Outline"
						onClick={(): void => {
							deleteCertificate(certificate);
						}}
						size="large"
						type="ghost"
						color={'error'}
					/>
				</Tooltip>
			</Container>
		]
	}));

	const activateSelectedCertificate = useCallback(() => {
		const selectedCertificate = localCertificates[parseInt(selectedRows[0], 10)];
		if (selectedCertificate.id) {
			selectPersonalCertificate(smimePassword, selectedCertificate.id).then((res) => {
				if ('data' in res) {
					createSnackbar({
						key: `certificate-activated`,
						replace: true,
						severity: 'success',
						label: t(
							'settings.uploadCertificate.certificateActivated',
							'Certificate activated successfully'
						),
						autoHideTimeout: 3000,
						hideButton: true
					});
					onClose(true);
				} else {
					createSnackbar({
						key: `error-on-certificate-activate`,
						replace: true,
						severity: 'error',
						label: t(
							'settings.uploadCertificate.certificateActivateFailed',
							'Failed to activate certificate'
						),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		}
	}, [createSnackbar, localCertificates, onClose, selectedRows, smimePassword, t]);

	const onCloseModal = useCallback(() => {
		onClose(isUpdateList);
	}, [isUpdateList, onClose]);

	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<ModalHeader onClose={onCloseModal} title={modalHeaderTitle} />
			<Container padding={{ all: 'small' }} crossAlignment="flex-start" height="fit">
				<Table
					rows={items}
					headers={headers}
					showCheckbox
					multiSelect={false}
					onSelectionChange={(selected): void => {
						setSelectedRows(selected);
					}}
				/>
				<ModalFooter
					onConfirm={activateSelectedCertificate}
					label={t('settings.uploadCertificate.setActive', 'Set Active')}
					disabled={selectedRows.length === 0}
					secondaryLabel={t('label.close', 'Close')}
					secondaryAction={onCloseModal}
				/>
			</Container>
		</Container>
	);
};
