/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { getPublicLinkUrl } from 'api/get-public-link-url';
import { uploadToFiles } from 'api/upload-file-to-files';
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
				: text.plainText.concat('\n', smartLinksArray.map((link) => link.plainTextLinks).join('\n'));
			setText({ plainText: newPlainText, richText: newRichText });
			onClose();
		} catch {
			errorSnackbar();
			onClose();
		}
	}, [errorSnackbar, files, getText, onClose, setText]);

	return (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
			style={{
				overflowY: 'auto'
			}}
		>
			<ModalHeader title={'Attachments too large'} onClose={onClose} />
			<Container
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
				style={{
					overflowY: 'auto'
				}}
			>
				<Text>convert attachments to smart links?</Text>
				<ModalFooter
					onConfirm={onConfirm}
					secondaryAction={onClose}
					label={t('label.create', 'Create')}
					secondaryLabel={t('label.cancel', 'Cancel')}
				/>
			</Container>
		</Container>
	);
};
