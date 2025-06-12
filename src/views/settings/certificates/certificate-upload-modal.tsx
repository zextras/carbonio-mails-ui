/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useRef, useState } from 'react';

import {
	Button,
	Checkbox,
	Container,
	Input,
	Padding,
	PasswordInput,
	Row,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { PersonalCertificate } from 'store/certificates/store';
import { handleCertificateFileUpload } from 'views/settings/certificates/certificate-utils';

type CertificateUploadModalPropType = {
	onConfirm: (certificate: PersonalCertificate, isSelected: boolean) => void;
	onClose: () => void;
};
export const CertificateUploadModal = ({
	onConfirm,
	onClose
}: CertificateUploadModalPropType): React.JSX.Element => {
	const [selectedFile, setSelectedFile] = useState<File | null>();
	const [password, setPassword] = useState<string>('');
	const [isSelected, setIsSelected] = useState<boolean>(true);
	const inputRef = useRef<HTMLInputElement>(null);
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const modalHeaderTitle = t('settings.uploadCertificate.uploadCertificate', 'Upload Certificate');
	const onCertificateFileBrowse = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.value = '';
			inputRef.current.click();
		}
	}, []);

	const onChange = useCallback((): void => {
		if (inputRef?.current?.files) {
			const file = inputRef?.current?.files[0];
			setSelectedFile(file);
		}
	}, []);

	const onCertificateFileUpload = useCallback(async (): Promise<void> => {
		if (selectedFile) {
			try {
				const result = await handleCertificateFileUpload(selectedFile, password ?? '');
				if (result.caCertificate) {
					const certificate = {
						privateKey: result.privateKey,
						certificate: result.certificate,
						caCertificate: result.caCertificate
					};
					onConfirm(certificate, isSelected);
					onClose();
				} else {
					throw new Error(
						t('settings.uploadCertificate.caCertificateNotFound', 'CA certificate can not be found')
					);
				}
			} catch (error) {
				createSnackbar({
					key: `error-on-certificate-upload`,
					replace: true,
					severity: 'error',
					label:
						error instanceof Error
							? error.message
							: t('settings.uploadCertificate.failed', 'Failed to upload certificate'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		}
	}, [createSnackbar, isSelected, onClose, onConfirm, password, selectedFile, t]);

	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<ModalHeader onClose={onClose} title={modalHeaderTitle} />
			<Container
				padding={{ all: 'small' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<Container orientation="horizontal" mainAlignment="flex-start">
					<Row mainAlignment="flex-start" width="22rem">
						<Input
							label={t(
								'settings.uploadCertificate.smimeCertificate',
								'S/MIME Certificate (i.e. certificate.p12)'
							)}
							defaultValue={selectedFile ? selectedFile.name : ''}
							data-testid="certificate-file-name"
							style={{ pointerEvents: 'none' }}
						/>
					</Row>
					<Padding left="medium">
						<Tooltip label={t('settings.browse', 'Browse')} maxWidth="100%">
							<Button
								minWidth="6rem"
								data-testid="BtnUploadCert"
								type="outlined"
								onClick={onCertificateFileBrowse}
								label={t('settings.browse', 'Browse')}
							/>
						</Tooltip>
					</Padding>
					<Row mainAlignment="flex-start" width="22rem" padding={{ left: 'small' }}>
						<PasswordInput
							value={password}
							onChange={(ev): void => {
								setPassword && setPassword(ev.target.value);
							}}
							label={t('settings.uploadCertificate.certificatePassword', 'Certificate Password')}
							data-testid="certificate-password"
						/>
					</Row>
				</Container>
				<Container orientation="horizontal" mainAlignment="flex-start">
					<Row width="auto">
						<Padding top="large">
							<Checkbox
								value={isSelected}
								onClick={(): void => setIsSelected(!isSelected)}
								label={t('settings.uploadCertificate.active', 'Active')}
							/>
						</Padding>
					</Row>
				</Container>
				<Input
					style={{display: "none"}}
					type="file"
					ref={inputRef}
					data-testid="certificate-file-input"
					onChange={onChange}
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore type should be fixed on the DS
					accept=".p12"
				/>
				<ModalFooter
					onConfirm={onCertificateFileUpload}
					label={t('settings.uploadCertificate.upload', 'Upload')}
					disabled={!selectedFile}
				/>
			</Container>
		</Container>
	);
};
