/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Button, Container, Input, Padding, Row, Tooltip } from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

const FileInput = styled.input`
	display: none;
`;

type RecipientsCertificateUploadModalProps = {
	onConfirm: (certificateContent: string | ArrayBuffer) => void;
	onClose: () => void;
};

export const RecipientsCertificateUploadModal = ({
	onConfirm,
	onClose
}: RecipientsCertificateUploadModalProps): React.JSX.Element => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const { t } = useTranslation();

	const modalHeaderTitle = t('settings.uploadCertificate.uploadCertificate', 'Upload Certificate');

	// Browse for file
	const handleFileBrowse = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.value = ''; // Reset input to allow selecting the same file again
			inputRef.current.click();
		}
	}, []);

	// Handle file selection
	const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] ?? null;
		setSelectedFile(file);
	}, []);

	// Upload file
	const handleFileUpload = useCallback(() => {
		if (!selectedFile) return;

		const reader = new FileReader();
		reader.readAsText(selectedFile);

		reader.onload = (e): void => {
			const fileContent = e.target?.result;
			if (fileContent) {
				onConfirm(fileContent);
			} else {
				console.error('Error: File content is null');
			}
		};

		reader.onerror = (): void => console.error('Error: Failed to read the file');
	}, [onConfirm, selectedFile]);

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
								'settings.uploadCertificate.smimeRecipientCertificate',
								'S/MIME Certificate (i.e. certificate.crt)'
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
								onClick={handleFileBrowse}
								label={t('settings.browse', 'Browse')}
							/>
						</Tooltip>
					</Padding>
				</Container>
				<FileInput
					type="file"
					ref={inputRef}
					data-testid="certificate-file-input"
					onChange={handleFileChange}
					accept=".crt,.pem"
				/>
				<ModalFooter
					onConfirm={handleFileUpload}
					label={t('settings.uploadCertificate.upload', 'Upload')}
					disabled={!selectedFile}
				/>
			</Container>
		</Container>
	);
};
