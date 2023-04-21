/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Text } from '@zextras/carbonio-design-system';
import { getBridgedFunctions, t } from '@zextras/carbonio-shell-ui';
import React, { FC, useCallback } from 'react';
import ModalFooter from '../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../carbonio-ui-commons/components/modals/modal-header';
import { useAppDispatch } from '../hooks/redux';
import { convAction, msgAction } from '../store/actions';

type DeleteConvConfirmPropType = {
	selectedIDs: Array<string>;
	isMessageView: boolean;
	deselectAll: () => void | undefined;
	onClose: () => void;
};
const DeleteConvConfirm: FC<DeleteConvConfirmPropType> = ({
	selectedIDs,
	isMessageView,
	deselectAll,
	onClose
}) => {
	const dispatch = useAppDispatch();

	const onConfirmConvDelete = useCallback(() => {
		dispatch(
			isMessageView
				? msgAction({
						operation: 'delete',
						ids: selectedIDs
				  })
				: convAction({
						operation: 'delete',
						ids: selectedIDs
				  })
		).then((res) => {
			if (res.type.includes('fulfilled')) {
				deselectAll && deselectAll();
				getBridgedFunctions()?.createSnackbar({
					key: `trash-${selectedIDs}`,
					replace: true,
					type: 'info',
					label: t('label.email_perm_deleted', 'E-mail permanently deleted'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				getBridgedFunctions()?.createSnackbar({
					key: `edit`,
					replace: true,
					type: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 3000
				});
			}
			onClose();
		});
	}, [dispatch, isMessageView, selectedIDs, onClose, deselectAll]);

	return (
		<>
			<Container
				padding={{ all: 'large' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<ModalHeader
					onClose={onClose}
					title={t(
						'messages.permanent_delete_title',
						'Are you sure to permanently delete this element?'
					)}
				/>
				<Container
					padding={{ all: 'small' }}
					mainAlignment="center"
					crossAlignment="flex-start"
					height="fit"
				>
					<Text overflow="break-word">
						{t(
							'messages.permanent_delete_body',
							'If you permanently delete this element you will not be able to recover it. Continue?'
						)}
					</Text>
					<ModalFooter
						onConfirm={onConfirmConvDelete}
						label={t('label.delete_permanently', 'Delete permanently')}
						background="error"
					/>
				</Container>
			</Container>
		</>
	);
};

export default DeleteConvConfirm;
