/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { getPublicLinkUrl } from 'api/get-public-link-url';
import { uploadToFiles } from 'api/upload-file-to-files';
import { AnimatedLoaderUploading } from 'assets/animated-loader';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { useEditorText } from 'store/editor/hooks';
import { generateSmartLinkHtml, insertAboveSignature } from 'ui-actions/utils';

export const ConvertToSmartlinkModal = ({
	onClose,
	editorId,
	files
}: {
	onClose: () => void;
	files: Array<File>;
	editorId: string;
}): React.JSX.Element => {
	const [t] = useTranslation();
	const [uploading, setUploading] = useState(false);

	const { createSnackbar } = useUiUtilities();
	const errorSnackbar = useCallback(() => {
		createSnackbar({
			key: `create-public-link-error`,
			replace: true,
			severity: 'error',
			hideButton: true,
			label: t('label.error_try_again', 'Something went wrong, please try again'),
			autoHideTimeout: 3000
		});
	}, [createSnackbar, t]);

	const { getText, setText } = useEditorText(editorId);

	const onConfirm = useCallback(async () => {
		setUploading(true);
		try {
			const text = getText();
			const smartLinksArray = await Promise.all(
				files.map(async (file) => {
					const uploadToFilesResponse = await uploadToFiles(file);
					const publicLinkUrl = await getPublicLinkUrl(uploadToFilesResponse);
					if (!publicLinkUrl) throw new Error('Link creation failed');
					return {
						richTextLinks: generateSmartLinkHtml({
							publicLinkUrl,
							filename: file.name
						}),
						plainTextLinks: publicLinkUrl
					};
				})
			);
			const newRichText = insertAboveSignature(
				text.richText,
				smartLinksArray.map((link) => link.richTextLinks).join('<br>\n')
			);
			const newPlainText = text.plainText.endsWith('\n')
				? text.plainText.concat(smartLinksArray.map((link) => link.plainTextLinks).join('\n'))
				: text.plainText.concat(
						'\n',
						smartLinksArray.map((link) => link.plainTextLinks).join('\n')
					);
			setText({ plainText: newPlainText, richText: newRichText });
			setUploading(false);
			onClose();
		} catch {
			errorSnackbar();
			onClose();
			setUploading(false);
		}
	}, [errorSnackbar, files, getText, onClose, setText]);

	const modalHeaderTitle = !uploading
		? t('smart_link_modal.header.title', 'Upload atttachment as Smart Link')
		: t('smart_link_modal.progress.title', 'Uploading attachment as Smart Link');

	const modalBodyText1 = !uploading
		? t('smart_link_modal.body.text1', 'The attachment exceeds the size limit')
		: t(
				'smart_link_modal.progress.text',
				'You are uploading a large attachment. This may take a moment, please wait'
			);

	const modalBodyText2 = !uploading ? (
		t('smart_link_modal.body.text2', 'Would you like to convert it into a Smart Link?')
	) : (
		<br />
	);

	const modalFooterLabel = !uploading
		? t('label.confirm', 'Confirm')
		: t('label.uploading', 'Uploading');

	const modalFooterSecondaryLabel = !uploading ? t('label.cancel', 'Cancel') : undefined;

	return (
		<Container
			data-testid="convert-to-smartlink-modal"
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
			style={{
				overflowY: 'auto'
			}}
		>
			<ModalHeader title={modalHeaderTitle} onClose={onClose} showCloseIcon={!uploading} />
			<Container
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
				style={{
					overflowY: 'auto'
				}}
			>
				<Text>{modalBodyText1}</Text>
				<Text>{modalBodyText2}</Text>
				<ModalFooter
					onConfirm={onConfirm}
					secondaryAction={onClose}
					label={modalFooterLabel}
					secondaryLabel={modalFooterSecondaryLabel}
					primaryButtonIcon={uploading ? AnimatedLoaderUploading : undefined}
				/>
			</Container>
		</Container>
	);
};
