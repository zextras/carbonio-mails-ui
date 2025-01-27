/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useRef, useState } from 'react';

import { Button, Container, Input, Padding, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ModalFooter from '../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../carbonio-ui-commons/components/modals/modal-header';

const FileInput = styled.input`
	display: none;
`;

type RecipientsCertificateUploadModalPropType = {
	onConfirm: (certificateContent: string | ArrayBuffer) => void;
	onClose: () => void;
};
export const RecipientsCertificateUploadModal = ({
	onConfirm,
	onClose
}: RecipientsCertificateUploadModalPropType): React.JSX.Element => {
	const [selectedFile, setSelectedFile] = useState<File | null>();
	const inputRef = useRef<HTMLInputElement>(null);
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
			const reader = new FileReader();
			reader.onload = async (e: ProgressEvent<FileReader>): Promise<void> => {
				const fileContent = e.target?.result;
				if (fileContent !== null && fileContent !== undefined) {
					onConfirm(fileContent);
				} else {
					console.error('Error file content is null');
				}
			};
			reader.onerror = (): void => {
				console.error('Failed to read the file');
			};
			// Read the file as text
			reader.readAsText(selectedFile);
		}
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
							value={selectedFile ? selectedFile.name : ''}
							data-testid="certificate-file-name"
							onChange={(): null => null}
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
				</Container>
				<FileInput
					type="file"
					ref={inputRef}
					data-testid="certificate-file-input"
					onChange={onChange}
					accept=".crt"
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
