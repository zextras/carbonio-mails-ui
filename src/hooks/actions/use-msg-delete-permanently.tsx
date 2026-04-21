/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from 'constants/index';
import { publishQuotaChangedEvent } from 'event-bus/publish-event';
import { isFocusModeMailView } from 'helpers/external-tabs';
import { isSpam, isTrash } from 'helpers/folders';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';
import { getMessageById } from 'store/emails/store';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { PermanentlyDeleteModal } from 'ui-actions/permanently-delete-modal';

type MsgDeletePermanentlyFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
	onActionComplete?: (ids: Array<string>) => void;
};

export const useMsgDeletePermanentlyFn = ({
	ids,
	folderId,
	onActionComplete
}: MsgDeletePermanentlyFunctionsParameter): ActionFn => {
	const { createModal, closeModal } = useUiUtilities();
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const deleteMessage = useCallback(
		async (onClose: () => void) => {
			const totalSize = ids.reduce((sum, id) => sum + (getMessageById(id)?.size ?? 0), 0);
			const response = await msgActionEmailStoreAction({
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

	const canExecute = useCallback(
		(): boolean => (isTrash(folderId) || isSpam(folderId)) && !isFocusModeMailView(),
		[folderId]
	);
	const execute = useCallback((): void => {
		if (canExecute()) {
			const modalId = Date.now().toString();
			const closeModalFn = (): void => closeModal(modalId);
			createModal(
				{
					id: modalId,
					onClose: closeModalFn,
					children: (
						<PermanentlyDeleteModal
							onClose={closeModalFn}
							onDeleteConfirm={(): Promise<void> => deleteMessage(closeModalFn)}
						/>
					)
				},
				true
			);
		}
	}, [canExecute, closeModal, createModal, deleteMessage]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgDeletePermanentlyDescriptor = ({
	ids,
	folderId,
	onActionComplete
}: MsgDeletePermanentlyFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useMsgDeletePermanentlyFn({ ids, folderId, onActionComplete });
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.DELETE_PERMANENTLY.id,
		icon: 'DeletePermanentlyOutline',
		label: t('label.delete_permanently', 'Delete Permanently'),
		execute,
		canExecute
	};
};
