/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useContext } from 'react';
import { Container, SnackbarManagerContext, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { convAction, msgAction } from '../store/actions';
import { ModalHeader } from '../views/sidebar/commons/modal-header';
import ModalFooter from '../views/sidebar/commons/modal-footer';

const DeleteConvConfirm = ({ selectedIDs, isMessageView, deselectAll, onClose, dispatch }) => {
	const [t] = useTranslation();
	const createSnackbar = useContext(SnackbarManagerContext);

	const onConfirmConvDelete = useCallback(() => {
		dispatch(
			isMessageView
				? msgAction({
						operation: `delete`,
						ids: selectedIDs
				  })
				: convAction({
						operation: `delete`,
						ids: selectedIDs
				  })
		).then((res) => {
			if (res.type.includes('fulfilled')) {
				deselectAll && deselectAll();
				createSnackbar({
					key: `trash-${selectedIDs}`,
					replace: true,
					type: 'info',
					label: isMessageView
						? t('label.email_perm_deleted', 'E-mail permanently deleted')
						: t('label.email_perm_deleted', 'E-mail permanently deleted'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				createSnackbar({
					key: `edit`,
					replace: true,
					type: 'error',
					label: isMessageView
						? t('label.error_try_again', 'Something went wrong, please try again')
						: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 3000
				});
			}
			// setOpenConfirm(false);
			onClose();
		});
	}, [dispatch, isMessageView, selectedIDs, onClose, createSnackbar, t, deselectAll]);

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
						t={t}
						background="error"
					/>
				</Container>
			</Container>
		</>
	);
};

export default DeleteConvConfirm;
