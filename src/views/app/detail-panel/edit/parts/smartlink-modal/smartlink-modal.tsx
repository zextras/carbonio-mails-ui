/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { SmartlinkAwaitingConfirmModal } from './smartlink-awaiting-confirm-modal';
import { SmartlinkUploadingModal } from './smartlink-uploading-modal';
import { getPublicLinkUrl } from 'api/get-public-link-url';
import { uploadToFiles } from 'api/upload-file-to-files';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { useEditorText } from 'store/editor/hooks';
import { generateSmartLinkHtml, insertAboveSignature } from 'ui-actions/utils';

export const SmartlinkModal = ({
	onClose,
	editorId,
	files
}: {
	onClose: () => void;
	files: Array<File>;
	editorId: string;
}): React.JSX.Element => {
	const [t] = useTranslation();
	const [awaitingConfirmation, setAwaitingConfirmation] = useState(true);
	const [uploadController, setUploadController] = useState<AbortController | null>(null);

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

	const onCloseCallback = useCallback(() => {
		uploadController?.abort?.();
		onClose();
	}, [uploadController, onClose]);

	const onConfirm = useCallback(async () => {
		setAwaitingConfirmation(false);
		try {
			const text = getText();
			const smartLinksArray = await Promise.all(
				files.map(async (file) => {
					const { upload, abortController } = uploadToFiles({
						file
					});
					setUploadController(abortController);
					const nodeId = await upload;
					const publicLinkUrl = await getPublicLinkUrl(nodeId);
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
			const newPlainText = text.plainText.concat(
				'\n',
				smartLinksArray.map((link) => link.plainTextLinks).join('\n')
			);
			setText({ plainText: newPlainText, richText: newRichText });
			setAwaitingConfirmation(true);
			onClose();
		} catch {
			errorSnackbar();
			onClose();
			setAwaitingConfirmation(true);
		}
	}, [errorSnackbar, files, getText, onClose, setText]);

	return awaitingConfirmation ? (
		<SmartlinkAwaitingConfirmModal onClose={onClose} onConfirm={onConfirm} />
	) : (
		<SmartlinkUploadingModal onClose={onCloseCallback} />
	);
};
