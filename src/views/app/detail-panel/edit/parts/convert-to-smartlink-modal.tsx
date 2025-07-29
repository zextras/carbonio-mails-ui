/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { uploadToFiles, sortFilesByLastModified, getPublicUrl } from './smart-link-utils';
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
		await uploadToFiles(files[0]);
		const lastModifiedFileResponse = await sortFilesByLastModified();
		const nodeId = lastModifiedFileResponse.data.data.getNode.children.nodes[0].id;
		const publicUrlResponse = await getPublicUrl(nodeId);
		const textWithLinks = addSmartLinksToText({
			publicLinkUrl: publicUrlResponse.data.data.createLink.url,
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
