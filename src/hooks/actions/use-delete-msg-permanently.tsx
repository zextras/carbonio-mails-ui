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

export const useDeleteMsgPermanentlyFn = (): ActionFn<
	{ ids: Array<string>; deselectAll: () => void },
	never
> => {
	const { createModal, closeModal } = useUiUtilities();

	const canExecute = useCallback((): boolean => true, []);
	const execute = useCallback(
		({ ids, deselectAll }): void => {
			const modalId = Date.now().toString();
			createModal(
				{
					id: modalId,
					children: (
						<StoreProvider>
							<DeleteConvConfirm
								selectedIDs={ids}
								isMessageView
								onClose={(): void => closeModal(modalId)}
								deselectAll={deselectAll || ((): null => null)}
							/>
						</StoreProvider>
					)
				},
				true
			);
		},
		[closeModal, createModal]
	);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useDeleteMsgPermanentlyDescriptor = (): UIActionDescriptor<never, never> => {
	const { canExecute, execute } = useDeleteMsgPermanentlyFn();
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.DELETE_PERMANENTLY.id,
		icon: 'DeletePermanentlyOutline',
		label: t('label.delete_permanently', 'Delete Permanently'),
		execute,
		canExecute
	};
};
