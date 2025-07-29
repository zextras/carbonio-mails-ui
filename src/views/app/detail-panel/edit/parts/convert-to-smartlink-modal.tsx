/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { getPublicLinkUrl } from 'api/get-public-link-url';
import { uploadToFiles } from 'api/upload-file-to-files';
import { useEditorText } from 'store/editor/hooks';
import { addSmartLinksToText } from 'ui-actions/utils';

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

	const { getText, setText } = useEditorText(editorId);
	const onConfirm = useCallback(async () => {
		const uploadToFilesResponse = await uploadToFiles(files[0]);
		const publicLinkUrl = await getPublicLinkUrl(uploadToFilesResponse.data.nodeId);
		const textWithLinks = addSmartLinksToText({
			publicLinkUrl: publicLinkUrl.data.data.createLink.url,
			text: getText(),
			filename: files[0].name
		});
		setText(textWithLinks);
		onClose();
	}, [files, getText, onClose, setText]);

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
