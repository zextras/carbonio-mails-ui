/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { msgActionSoapApi } from '../api/msg-action';
import ModalFooter from '../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../carbonio-ui-commons/components/modals/modal-header';
import { useUiUtilities } from '../hooks/use-ui-utilities';
import { convAction } from '../store/actions';
import { deleteMessagesFromConversation } from '../store/zustand/emails/store';

type DeleteConvConfirmPropType = {
	selectedIDs: Array<string>;
	isMessageView: boolean;
	deselectAll?: () => void | undefined;
	onClose: () => void;
};

export const DeleteConvConfirm = ({
	selectedIDs,
	isMessageView,
	deselectAll,
	onClose
}: DeleteConvConfirmPropType): React.JSX.Element => {
	const [t] = useTranslation();
	const { createSnackbar } = useUiUtilities();

	const onConfirmConvDelete = useCallback(async () => {
		const response = isMessageView
			? await msgActionSoapApi({
					operation: 'delete',
					ids: selectedIDs
				})
			: await convAction({
					operation: 'delete',
					ids: selectedIDs
				});
		if (!('Fault' in response)) {
			if (!isMessageView) {
				deleteMessagesFromConversation(selectedIDs);
			}
			deselectAll?.();
			createSnackbar({
				key: `trash-${selectedIDs}`,
				replace: true,
				severity: 'info',
				label: t('label.email_perm_deleted', 'E-mail permanently deleted'),
				autoHideTimeout: 3000,
				hideButton: true
			});
		} else {
			createSnackbar({
				key: `edit`,
				replace: true,
				severity: 'error',
				label: t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: 3000
			});
		}
		onClose();
	}, [isMessageView, selectedIDs, onClose, deselectAll, createSnackbar, t]);

	return (
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
	);
};
