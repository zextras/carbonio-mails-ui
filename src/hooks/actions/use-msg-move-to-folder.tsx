/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { noop } from 'lodash';
import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from '../../constants';
import { StoreProvider } from '../../store/redux';
import { ActionFn, UIActionDescriptor } from '../../types';
import MoveConvMessage from '../../ui-actions/move-conv-msg';
import { useAppDispatch } from '../redux';
import { useUiUtilities } from '../use-ui-utilities';

export const useMsgMoveToFolderFn = ({
	folderId,
	messageId,
	deselectAll
}: {
	folderId: string;
	messageId: string;
	deselectAll: () => void;
}): ActionFn => {
	const { createModal, closeModal } = useUiUtilities();
	const dispatch = useAppDispatch();
	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback((): void => {
		const modalId = Date.now().toString();
		createModal(
			{
				id: modalId,
				maxHeight: '90vh',
				size: 'medium',
				children: (
					<StoreProvider>
						<MoveConvMessage
							folderId={folderId}
							selectedIDs={[messageId]}
							onClose={(): void => closeModal(modalId)}
							isMessageView
							isRestore={false}
							deselectAll={deselectAll ?? noop}
							dispatch={dispatch}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [closeModal, createModal, deselectAll, dispatch, messageId, folderId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgMoveToFolderDescriptor = ({
	folderId,
	messageId,
	deselectAll
}: {
	folderId: string;
	messageId: string;
	deselectAll: () => void;
}): UIActionDescriptor => {
	const { canExecute, execute } = useMsgMoveToFolderFn({
		folderId,
		messageId,
		deselectAll
	});
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.MOVE.id,
		icon: 'MoveOutline',
		label: t('label.move', 'Move'),
		execute,
		canExecute
	};
};
