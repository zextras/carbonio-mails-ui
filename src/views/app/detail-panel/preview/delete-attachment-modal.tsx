/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import React, { FC, useCallback } from 'react';
import ModalFooter from '../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../carbonio-ui-commons/components/modals/modal-header';

export type DeleteAttachmentModalPropsType = {
	onClose: () => void;
	onDownloadAndDelete: () => void;
	onDeleteAttachment: () => void;
};

const DeleteAttachmentModal: FC<DeleteAttachmentModalPropsType> = ({
	onClose,
	onDownloadAndDelete,
	onDeleteAttachment
}) => {
	const onDeleteConfirm = useCallback(() => {
		onClose();
		onDeleteAttachment();
	}, [onClose, onDeleteAttachment]);

	const onDownloadAndDeleteConfirm = useCallback(() => {
		onClose();
		onDownloadAndDelete();
	}, [onClose, onDownloadAndDelete]);

	return (
		<>
			<ModalHeader onClose={onClose} title={t('header.warning', 'Warning')} />
			<Container padding={{ right: 'large', top: 'extrasmall' }} crossAlignment="flex-start">
				<Text overflow="break-word">
					{t(
						'message.delete_attachment_message1',
						'Your attachment will be permanently deleted from Carbonio.'
					)}
				</Text>
				<Text overflow="break-word" style={{ textAlign: 'left' }}>
					{t('message.delete_attachment_message2', 'Do you want to download it before?')}
				</Text>
			</Container>
			<ModalFooter
				onConfirm={onDeleteConfirm}
				label={t('label.delete_permanently', 'Delete Permanently')}
				secondaryBtnType={'outlined'}
				secondaryAction={onDownloadAndDeleteConfirm}
				secondaryLabel={t('label.download_and_delete', 'Download And Delete')}
				secondaryColor="error"
				color="error"
				paddingTop="extrasmall"
			/>
		</>
	);
};

export default DeleteAttachmentModal;
