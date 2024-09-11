/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ActionFn, UIActionDescriptor } from './use-redirect-msg';
import { MessageActionsDescriptors } from '../../constants';
import { StoreProvider } from '../../store/redux';
import DeleteConvConfirm from '../../ui-actions/delete-conv-modal';
import { useUiUtilities } from '../use-ui-utilities';

type DeleteMsgPermanently = {
	messageId: string;
	deselectAll: () => void;
};
export const useDeleteMsgPermanentlyFn = ({
	messageId,
	deselectAll
}: DeleteMsgPermanently): ActionFn => {
	const { createModal, closeModal } = useUiUtilities();

	const canExecute = useCallback((): boolean => true, []);
	const execute = useCallback((): void => {
		const modalId = Date.now().toString();
		createModal(
			{
				id: modalId,
				children: (
					<StoreProvider>
						<DeleteConvConfirm
							selectedIDs={[messageId]}
							isMessageView
							onClose={(): void => closeModal(modalId)}
							deselectAll={deselectAll || ((): null => null)}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [closeModal, createModal, deselectAll, messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useDeleteMsgPermanentlyDescriptor = ({
	messageId,
	deselectAll
}: DeleteMsgPermanently): UIActionDescriptor => {
	const { canExecute, execute } = useDeleteMsgPermanentlyFn({ messageId, deselectAll });
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.DELETE_PERMANENTLY.id,
		icon: 'DeletePermanentlyOutline',
		label: t('label.delete_permanently', 'Delete Permanently'),
		execute,
		canExecute
	};
};
