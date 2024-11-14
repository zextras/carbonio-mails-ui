/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useRef, useState } from 'react';

import {
	Button,
	Container,
	Input,
	Padding,
	PasswordInput,
	Row,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';

import { handleCertificateFileUpload } from './certificate-utils';
import ModalFooter from '../../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../../carbonio-ui-commons/components/modals/modal-header';
import { Certificate } from '../../../../../store/zustand/certificates/store';

const FileInput = styled.input`
	display: none;
`;

type CertificateUploadModalPropType = {
	emailAddress?: string;
	onConfirm: (certificate: Certificate) => void;
	onClose: () => void;
};
export const CertificateUploadModal = ({
	emailAddress,
	onConfirm,
	onClose
}: CertificateUploadModalPropType): React.JSX.Element => {
	const [selectedFile, setSelectedFile] = useState<File | null>();
	const [password, setPassword] = useState<string>('');
	const inputRef = useRef<HTMLInputElement>(null);
	const createSnackbar = useSnackbar();

	const modalHeaderTitle = t('label.upload certificate', 'Upload Certificate');
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
				if (result.emailAddress === emailAddress) {
					const certificate = {
						privateKey: result.privateKey,
						certificate: result.certificate,
						caCertificate: result.caCertificate
					};
					onConfirm(certificate);
					onClose();
				} else {
					throw new Error(
						t('composer.uploadCertificate.email_not_match', 'Email address does not match')
					);
				}
			} catch (error) {
				createSnackbar({
					key: `error-on-certificate-upload`,
					replace: true,
					severity: 'error',
					label: t('composer.uploadCertificate.failed', 'Failed to upload certificate'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		}
	}, [createSnackbar, emailAddress, onClose, onConfirm, password, selectedFile]);

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
					<Row mainAlignment="flex-start" width="15vw">
						<Input
							label={t('label.certificate_password', 'S/MIME Certificate (i.e. certificate.pfx)')}
							value={selectedFile ? selectedFile.name : ''}
							hideBorder
						/>
					</Row>
					<Padding left="medium">
						<Tooltip label={t('settings.browse', 'Browse')} maxWidth="100%">
							<Button
								data-testid="BtnUploadCert"
								type="outlined"
								onClick={onCertificateFileBrowse}
								label={t('settings.browse', 'Browse')}
							/>
						</Tooltip>
					</Padding>
					<Row mainAlignment="flex-start" width="20vw" padding={{ left: 'small' }}>
						<PasswordInput
							value={password}
							onChange={(ev): void => {
								setPassword(ev.target.value);
							}}
							label={t('label.certificate_password', 'Certificate Password')}
						/>
					</Row>
				</Container>
				<FileInput
					type="file"
					ref={inputRef}
					data-testid="certificate-file-input"
					onChange={onChange}
				/>
				<ModalFooter onConfirm={onCertificateFileUpload} label={t('label.upload', 'Upload')} />
			</Container>
		</Container>
	);
};
