/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useModal, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from 'constants/index';
import { publishQuotaChangedEvent } from 'event-bus/publish-event';
import { isSpam, isTrash } from 'helpers/folders';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { getConversationMessages } from 'store/emails/store';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { PermanentlyDeleteModal } from 'ui-actions/permanently-delete-modal';

type ConvDeletePermanentlyFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
	onActionComplete?: (conversationsIds: Array<string>) => void;
};

export const useConvDeletePermanentlyFn = ({
	ids,
	folderId,
	onActionComplete
}: ConvDeletePermanentlyFunctionsParameter): ActionFn => {
	const { createModal, closeModal } = useModal();

	const canExecute = useCallback((): boolean => isTrash(folderId) || isSpam(folderId), [folderId]);

	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const deleteConversation = useCallback(
		async (onClose: () => void) => {
			const totalSize = ids.reduce((sum, id) => {
				const convMsgSize = getConversationMessages(id).reduce(
					(msgSum, msg) => msgSum + (msg.size ?? 0),
					0
				);
				return sum + convMsgSize;
			}, 0);
			const response = await convActionEmailStoreAction({
				operation: 'delete',
				ids
			});
			if (!('Fault' in response)) {
				publishQuotaChangedEvent(totalSize);
				onActionComplete && onActionComplete(ids);
				createSnackbar({
					key: `trash-${ids}`,
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
		},
		[ids, onActionComplete, createSnackbar, t]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			const id = 'permanently-delete-conversation-modal';
			const closeModalFn = (): void => closeModal(id);
			createModal(
				{
					id,
					onClose: closeModalFn,
					children: (
						<PermanentlyDeleteModal
							onClose={closeModalFn}
							onDeleteConfirm={(): Promise<void> => deleteConversation(closeModalFn)}
						/>
					)
				},
				true
			);
		}
	}, [canExecute, closeModal, createModal, deleteConversation]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvDeletePermanentlyDescriptor = ({
	ids,
	folderId,
	onActionComplete
}: ConvDeletePermanentlyFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvDeletePermanentlyFn({
		ids,
		folderId,
		onActionComplete
	});

	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.DELETE_PERMANENTLY.id,
		icon: 'DeletePermanentlyOutline',
		label: t('label.delete_permanently', 'Delete Permanently'),
		execute,
		canExecute
	};
};
