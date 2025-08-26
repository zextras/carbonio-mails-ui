/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useModal, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from 'constants/index';
import { isSpam, isTrash } from 'helpers/folders';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { ActionFn, UIActionDescriptor } from 'types/index.d';
import { PermanentlyDeleteModal } from 'ui-actions/permanently-delete-modal';

type ConvDeletePermanentlyFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
};

export const useConvDeletePermanentlyFn = ({
	ids,
	folderId
}: ConvDeletePermanentlyFunctionsParameter): ActionFn => {
	const { createModal, closeModal } = useModal();

	const canExecute = useCallback((): boolean => isTrash(folderId) || isSpam(folderId), [folderId]);

	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const deleteConversation = useCallback(
		async (onClose: () => void) => {
			const response = await convActionEmailStoreAction({
				operation: 'delete',
				ids
			});
			if (!('Fault' in response)) {
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
		[ids, createSnackbar, t]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			const id = 'permanently-delete-conversation-modal';
			const closeModalFn = (): void => closeModal(id);
			createModal(
				{
					id,
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
	folderId
}: ConvDeletePermanentlyFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvDeletePermanentlyFn({
		ids,
		folderId
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
