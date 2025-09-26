/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState } from 'react';

import { useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { SmartlinkAwaitingConfirmModal } from './smartlink-awaiting-confirm-modal';
import { SmartlinkUploadingModal } from './smartlink-uploading-modal';
import { CreateLinkType, Link } from './types';
import { uploadToFiles } from 'api/upload-file-to-files';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { useEditorText } from 'store/editor/hooks';
import { generateSmartLinkHtml, insertAboveSignature } from 'ui-actions/utils';

export const SmartlinkFromLocalModal = ({
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
	const [getLink, getLinkAvailable] =
		useIntegratedFunction<(props: CreateLinkType) => Promise<Link>>('get-link');
	const { createSnackbar } = useUiUtilities();
	const errorSnackbar = useCallback(() => {
		createSnackbar({
			key: 'create-public-link-error',
			replace: true,
			severity: 'error',
			hideButton: true,
			label: t('label.error_try_again', 'Something went wrong, please try again'),
			autoHideTimeout: 3000
		});
	}, [createSnackbar, t]);

	const uploadCancelledSnackbar = useCallback(() => {
		createSnackbar({
			key: 'upload-cancelled',
			replace: true,
			severity: 'info',
			hideButton: true,
			label: t('label.upload_cancelled', 'Upload cancelled'),
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

					const response =
						getLinkAvailable &&
						(await getLink({
							node: { id: nodeId },
							type: 'createLink',
							description: nodeId
						}));
					if (!response || !response.url) {
						errorSnackbar();
						throw new Error('Public link creation failed');
					}
					return {
						richTextLinks: generateSmartLinkHtml({
							publicLinkUrl: response.url,
							filename: file.name
						}),
						plainTextLinks: response.url
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
		} catch (error) {
			if (error instanceof Error && error.name === 'CanceledError') {
				uploadCancelledSnackbar();
			} else {
				errorSnackbar();
			}
			onClose();
			setAwaitingConfirmation(true);
		}
	}, [
		errorSnackbar,
		files,
		getLink,
		getLinkAvailable,
		getText,
		onClose,
		setText,
		uploadCancelledSnackbar
	]);

	return awaitingConfirmation ? (
		<SmartlinkAwaitingConfirmModal onClose={onClose} onConfirm={onConfirm} />
	) : (
		<SmartlinkUploadingModal onClose={onCloseCallback} />
	);
};
