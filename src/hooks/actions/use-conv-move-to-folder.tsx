/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from '../../constants';
import { isTrash } from '../../helpers/folders';
import { StoreProvider } from '../../store/redux';
import { ActionFn, UIActionDescriptor } from '../../types';
import MoveConvMessage from '../../ui-actions/move-conv-msg';
import { useAppDispatch } from '../redux';
import { useUiUtilities } from '../use-ui-utilities';

export const useConvMoveToFolderFn = ({
	folderId,
	ids,
	deselectAll
}: {
	folderId: string;
	ids: Array<string>;
	deselectAll: () => void;
}): ActionFn => {
	const { createModal, closeModal } = useUiUtilities();
	const dispatch = useAppDispatch();
	const canExecute = useCallback((): boolean => !isTrash(folderId), [folderId]);

	const execute = useCallback((): void => {
		const id = Date.now().toString();
		createModal(
			{
				id,
				maxHeight: '90vh',
				size: 'medium',
				children: (
					<StoreProvider>
						<MoveConvMessage
							folderId={folderId}
							selectedIDs={ids}
							onClose={(): void => closeModal(id)}
							isMessageView={false}
							isRestore={false}
							deselectAll={deselectAll}
							dispatch={dispatch}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [createModal, folderId, ids, deselectAll, dispatch, closeModal]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvMoveToFolderDescriptor = ({
	folderId,
	ids,
	deselectAll
}: {
	folderId: string;
	ids: Array<string>;
	deselectAll: () => void;
}): UIActionDescriptor => {
	const { canExecute, execute } = useConvMoveToFolderFn({
		folderId,
		ids,
		deselectAll
	});
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.MOVE.id,
		icon: 'MoveOutline',
		label: t('label.move', 'Move'),
		execute,
		canExecute
	};
};
