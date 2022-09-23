/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useContext, useMemo } from 'react';
import { Container, Text, SnackbarManagerContext } from '@zextras/carbonio-design-system';
import { deleteTag, t } from '@zextras/carbonio-shell-ui';
import ModalFooter from '../../commons/modal-footer';
import ModalHeader from '../../commons/modal-header';
import { DeleteTagModalPropsType } from '../../../../types/sidebar';

const DeleteTagModal: FC<DeleteTagModalPropsType> = ({ onClose, tag }) => {
	const createSnackbar = useContext(SnackbarManagerContext);

	const title = useMemo(
		() =>
			t('label.delete_tag_name', {
				name: tag?.name,
				defaultValue: 'Delete "{{name}}" tag'
			}),
		[tag?.name]
	);

	const onConfirm = useCallback(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		deleteTag(tag?.id).then((res: any) => {
			if (res.action) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				createSnackbar({
					key: `delete-tag`,
					replace: true,
					type: 'success',
					label: t('messages.snackbar.tag_deleted', {
						name: tag?.name,
						defaultValue: '{{name}} Tag deleted successfully'
					}),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
			onClose();
		});
	}, [createSnackbar, onClose, tag]);

	return (
		<>
			<ModalHeader onClose={onClose} title={title} />
			<Container padding={{ horizontal: 'large' }}>
				<Text>
					{t('message.delete_tag_message1', {
						name: tag?.name,
						defaultValue: `Are you sure to delete "{{name}}" Tag?`
					})}
				</Text>
				<Text overflow="break-word" style={{ textAlign: 'center' }}>
					{t(
						'message.delete_tag_message2',
						'Once deleted, it will be removed from every item marked with it.'
					)}
				</Text>
			</Container>
			<ModalFooter
				onConfirm={onConfirm}
				label={t('label.delete', 'Delete')}
				disabled={false}
				background="error"
			/>
		</>
	);
};

export default DeleteTagModal;
