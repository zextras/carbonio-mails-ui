/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useModal } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from '../../constants';
import { isSpam, isTrash } from '../../helpers/folders';
import { StoreProvider } from '../../store/redux';
import { ActionFn, UIActionDescriptor } from '../../types';
import DeleteConvConfirm from '../../ui-actions/delete-conv-modal';

type ConvDeletePermanentlyFunctionsParameter = {
	ids: Array<string>;
	deselectAll?: () => void;
	folderId: string;
};

export const useConvDeletePermanentlyFn = ({
	ids,
	deselectAll,
	folderId
}: ConvDeletePermanentlyFunctionsParameter): ActionFn => {
	const { createModal, closeModal } = useModal();

	const canExecute = useCallback((): boolean => isTrash(folderId) || isSpam(folderId), [folderId]);

	const execute = useCallback((): void => {
		if (canExecute()) {
			const id = Date.now().toString();
			createModal(
				{
					id,
					children: (
						<StoreProvider>
							<DeleteConvConfirm
								selectedIDs={ids}
								isMessageView={false}
								onClose={(): void => closeModal(id)}
								deselectAll={deselectAll}
							/>
						</StoreProvider>
					)
				},
				true
			);
		}
	}, [canExecute, closeModal, createModal, deselectAll, ids]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvDeletePermanentlyDescriptor = ({
	ids,
	folderId,
	deselectAll
}: ConvDeletePermanentlyFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvDeletePermanentlyFn({
		ids,
		folderId,
		deselectAll
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
