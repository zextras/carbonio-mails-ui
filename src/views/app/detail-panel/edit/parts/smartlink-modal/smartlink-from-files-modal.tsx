/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { SmartlinkAwaitingConfirmModal } from './smartlink-awaiting-confirm-modal';
import { FileNode } from '../../edit-utils-hooks/use-upload-from-files';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { useEditorText } from 'store/editor/hooks';
import { generateSmartLinkHtml, insertAboveSignature } from 'ui-actions/utils';

export const SmartlinkFromFilesModal = ({
	onClose,
	editorId,
	fileNodes
}: {
	onClose: () => void;
	fileNodes: Array<FileNode>;
	editorId: string;
}): React.JSX.Element => {
	const [t] = useTranslation();
	const [getLink, getLinkAvailable] = useIntegratedFunction('get-link');
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

	const { getText, setText } = useEditorText(editorId);

	const onConfirm = useCallback(async () => {
		try {
			const text = getText();

			const smartLinksArray = await Promise.all(
				fileNodes.map(async (fileNode) => {
					const publicLinkUrl =
						getLinkAvailable &&
						(await getLink({
							node: fileNode,
							type: 'createLink',
							description: fileNode.id
						}));
					if (!publicLinkUrl) {
						errorSnackbar();
					}
					return {
						richTextLinks: generateSmartLinkHtml({
							publicLinkUrl,
							filename: fileNode.name
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
			onClose();
		} catch {
			errorSnackbar();
			onClose();
		}
	}, [errorSnackbar, fileNodes, getLink, getLinkAvailable, getText, onClose, setText]);

	return <SmartlinkAwaitingConfirmModal onClose={onClose} onConfirm={onConfirm} />;
};
