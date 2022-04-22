/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Text, SnackbarManagerContext } from '@zextras/carbonio-design-system';
import { deleteTag } from '@zextras/carbonio-shell-ui';
import ModalFooter from '../../commons/modal-footer';
import { ModalHeader } from '../../commons/modal-header';

type ComponentProps = {
	onClose: () => void;
	tag?: {
		CustomComponent: ReactElement;
		active: boolean;
		color: number;
		divider: boolean;
		id: string;
		label: string;
		name: string;
		open: boolean;
	};
};
const DeleteTagModal: FC<ComponentProps> = ({ onClose, tag }): ReactElement => {
	const createSnackbar = useContext(SnackbarManagerContext);
	const [t] = useTranslation();

	const title = useMemo(
		() =>
			t('label.delete_tag_name', {
				name: tag?.name,
				defaultValue: 'Delete "{{name}}" tag'
			}),
		[t, tag?.name]
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
	}, [createSnackbar, onClose, t, tag]);

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
				<Text overflow="break-word">
					{t(
						'message.delete_tag_message2',
						'Deleting it will be removed from every item affected by.'
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
