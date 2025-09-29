/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';

import {
	Button,
	CloseModalFn,
	Container,
	CreateModalFn,
	Table,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { deletePersonalCertificate } from 'api/delete-personal-certificate-api';
import { selectPersonalCertificate } from 'api/select-personal-certificate-api';
import { useSmimePasswordStore } from 'store/certificates/store';
import { Certificate } from 'types/certificates/certificates';
import CertificateDeleteModal from 'views/settings/certificates/certificate-delete-modal';

type ShowAllCertificatesModalPropType = {
	certificates: Certificate[];
	onClose: (isUpdateList: boolean) => void;
	createModal: CreateModalFn;
	closeModal: CloseModalFn;
};

const ShowAllCertificatesModal = ({
	certificates,
	onClose,
	createModal,
	closeModal
}: ShowAllCertificatesModalPropType): React.JSX.Element => {
	const [t] = useTranslation();
	const createSnackbar = useSnackbar();
	const { smimePassword } = useSmimePasswordStore();

	const modalHeaderTitle = `${t('settings.uploadCertificate.personalCertificate', 'Personal Certificates of')} ${certificates[0]?.email}`;
	const [selectedRows, setSelectedRows] = useState<string[]>([]);
	const [localCertificates, setLocalCertificates] = useState(certificates);
	const [isUpdateList, setIsUpdateList] = useState(false);

	// Common header configuration
	const allCertificatesHeaders = useMemo(
		() => [
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
			{ id: 'action', label: '', width: '20%' }
		],
		[t]
	);

	// Show Snackbar utility
	const showSnackbar = useCallback(
		(key: string, severity: 'success' | 'error', label: string) => {
			createSnackbar({
				key,
				replace: true,
				severity,
				label,
				autoHideTimeout: 3000,
				hideButton: true
			});
		},
		[createSnackbar]
	);

	// Get certificate status
	const getCertificateStatus = useCallback(
		(certificate: Certificate) => {
			if (certificate.selected) return t('settings.uploadCertificate.active', 'Active');
			if (certificate.notAfter > Date.now())
				return t('settings.uploadCertificate.inactive', 'Inactive');
			return t('settings.uploadCertificate.expired', 'Expired');
		},
		[t]
	);

	// Handle delete operation for a certificate
	const handleDeleteCertificate = useCallback(
		async (certificate: Certificate) => {
			const res = await deletePersonalCertificate(certificate.id, smimePassword);
			if ('data' in res) {
				showSnackbar(
					'certificate-deleted',
					'success',
					t('settings.uploadCertificate.certificateDeleted', 'Certificate deleted successfully')
				);
				setLocalCertificates((prev) => prev.filter((cert) => cert.id !== certificate.id));
				setIsUpdateList(true);
			} else {
				showSnackbar(
					'error-on-certificate-delete',
					'error',
					t('settings.uploadCertificate.certificateDeleteFailed', 'Failed to delete certificate')
				);
			}
		},
		[showSnackbar, smimePassword, t]
	);
	const deleteCertificateModal = useCallback(
		(certificate: Certificate) => {
			createModal(
				{
					id: certificate.email,
					size: 'small',
					onClose: (): void => {
						closeModal?.(certificate.email);
					},
					children: (
						<CertificateDeleteModal
							onClose={(): void => closeModal?.(certificate.email)}
							onConfirmDelete={(): void => {
								closeModal?.(certificate.email);
								handleDeleteCertificate(certificate);
							}}
							email={certificate.email}
						/>
					)
				},
				true
			);
		},
		[createModal, closeModal, handleDeleteCertificate]
	);

	// Create table rows dynamically from certificates
	const getCertificateRows = useMemo(
		() =>
			localCertificates.map((certificate, index) => ({
				id: index.toString(),
				columns: [
					certificate.issuer,
					new Date(certificate.notBefore).toLocaleString(),
					new Date(certificate.notAfter).toLocaleString(),
					getCertificateStatus(certificate),
					certificate.serial,
					<Container key={certificate.email}>
						<Tooltip
							label={t('settings.uploadCertificate.deleteCertificate', 'Delete Certificate')}
						>
							<Button
								icon="Trash2Outline"
								onClick={(): void => deleteCertificateModal(certificate)}
								size="large"
								type="ghost"
								color="error"
							/>
						</Tooltip>
					</Container>
				]
			})),
		[localCertificates, getCertificateStatus, t, deleteCertificateModal]
	);

	// Handle certificate activation
	const activateSelectedCertificate = useCallback(async () => {
		const selectedCertificate = localCertificates[parseInt(selectedRows[0], 10)];
		if (!selectedCertificate?.id) return;

		const res = await selectPersonalCertificate(smimePassword, selectedCertificate.id);
		if ('data' in res) {
			showSnackbar(
				'certificate-activated',
				'success',
				t('settings.uploadCertificate.certificateActivated', 'Certificate activated successfully')
			);
			onClose(true);
		} else {
			showSnackbar(
				'error-on-certificate-activate',
				'error',
				t('settings.uploadCertificate.certificateActivateFailed', 'Failed to activate certificate')
			);
		}
	}, [showSnackbar, localCertificates, onClose, selectedRows, smimePassword, t]);

	// Close modal callback
	const onCloseModal = useCallback(() => onClose(isUpdateList), [isUpdateList, onClose]);

	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<ModalHeader onClose={onCloseModal} title={modalHeaderTitle} />
			<Container padding={{ all: 'small' }} crossAlignment="flex-start" height="fit">
				<Table
					rows={getCertificateRows}
					headers={allCertificatesHeaders}
					showCheckbox
					multiSelect={false}
					onSelectionChange={setSelectedRows}
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

export default ShowAllCertificatesModal;
