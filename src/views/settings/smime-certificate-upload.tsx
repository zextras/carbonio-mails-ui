/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	Button,
	Container,
	FormSubSection,
	Input,
	Padding,
	PasswordInput,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';

import { sMimeCertificateSubSection } from './subsections';
import { useUiUtilities } from '../../hooks/use-ui-utilities';
import { getCertificateInfo } from '../../store/actions/get-certificate-info';
import { uploadCertificate } from '../../store/actions/upload-certificate';

const FileInput = styled.input`
	display: none;
`;

const SmimeCertificateUpload: FC = () => {
	const { createSnackbar } = useUiUtilities();
	const sectionTitle = useMemo(() => sMimeCertificateSubSection(), []);
	const inputRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>();
	const [password, setPassword] = useState<string>('');
	const [isCertUploaded, setIsCertUploaded] = useState<boolean>(false);

	const onBrowse = useCallback((): void => {
		if (inputRef.current) {
			inputRef.current.value = '';
			inputRef.current.click();
		}
	}, []);

	const onCertInfoLoad = useCallback((res) => {
		if ('data' in res) {
			setIsCertUploaded(true);
		} else {
			setIsCertUploaded(false);
		}
	}, []);

	useEffect(() => {
		getCertificateInfo().then((res) => {
			onCertInfoLoad(res);
		});
	}, [onCertInfoLoad]);

	const onChange = useCallback((): void => {
		if (inputRef?.current?.files) {
			const file = inputRef?.current?.files[0];
			setSelectedFile(file);
		}
	}, []);

	const onUpload = useCallback((): void => {
		selectedFile &&
			uploadCertificate(selectedFile, password).then(
				(res: { data: Response } | { error: unknown }) => {
					if ('data' in res) {
						createSnackbar({
							key: `upload-cert`,
							replace: true,
							type: 'success',
							label: t(
								'settings.upload_certificate_success',
								'The certificate has been uploaded and verified.'
							),
							autoHideTimeout: 3000,
							hideButton: true
						});
						setSelectedFile(null);
						setPassword('');
						setIsCertUploaded(true);
					} else {
						createSnackbar({
							key: `upload-cert`,
							replace: true,
							type: 'error',
							label: t(
								'settings.upload_certificate_error',
								'There was an error verifying the certificate, please check the format or the password'
							),
							autoHideTimeout: 3000,
							hideButton: true
						});
					}
				}
			);
	}, [createSnackbar, password, selectedFile]);

	return (
		<FormSubSection id={sectionTitle.id} label={sectionTitle.label} padding={{ all: 'medium' }}>
			<Container
				crossAlignment="baseline"
				padding={{ horizontal: 'small', bottom: 'small', top: 'medium' }}
			>
				{isCertUploaded && (
					<Container crossAlignment="baseline" padding={{ bottom: 'small' }}>
						<Text color={'secondary'}>
							{t(
								'settings.certificate_uploaded_msg',
								'The certificate is uploaded but you can still upload a new one.'
							)}
						</Text>
					</Container>
				)}
				<Container orientation="horizontal" mainAlignment="flex-start">
					<Row mainAlignment="flex-start" width="30vw">
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
								onClick={onBrowse}
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
					<Padding left="medium">
						<Tooltip label={`${t('label.upload', 'Upload')}`} maxWidth="100%">
							<Button
								data-testid="BtnUploadCert"
								type="outlined"
								onClick={onUpload}
								label={`${t('label.upload', 'Upload')}`}
							/>
						</Tooltip>
					</Padding>
				</Container>
				<FileInput type="file" ref={inputRef} onChange={onChange} />
			</Container>
		</FormSubSection>
	);
};

export default SmimeCertificateUpload;
