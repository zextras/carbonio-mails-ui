/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { noop } from 'lodash';
import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from '../../constants';
import { isTrash } from '../../helpers/folders';
import { ActionFn, UIActionDescriptor } from '../../types';
import { MoveConvMessage } from '../../ui-actions/move-conv-msg';
import { useUiUtilities } from '../use-ui-utilities';

export const useConvRestoreFn = ({
	folderId,
	conversationId,
	deselectAll
}: {
	folderId: string;
	conversationId: string;
	deselectAll: () => void;
}): ActionFn => {
	const { createModal, closeModal } = useUiUtilities();
	const canExecute = useCallback((): boolean => isTrash(folderId), [folderId]);

	const execute = useCallback((): void => {
		if (canExecute()) {
			const modalId = Date.now().toString();
			createModal(
				{
					id: modalId,
					maxHeight: '90vh',
					size: 'medium',
					children: (
						<MoveConvMessage
							folderId={folderId}
							selectedIDs={[conversationId]}
							onClose={(): void => closeModal(modalId)}
							isMessageView
							isRestore
							deselectAll={deselectAll ?? noop}
						/>
					)
				},
				true
			);
		}
	}, [canExecute, createModal, folderId, conversationId, deselectAll, closeModal]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvRestoreDescriptor = ({
	folderId,
	conversationId,
	deselectAll
}: {
	folderId: string;
	conversationId: string;
	deselectAll: () => void;
}): UIActionDescriptor => {
	const { canExecute, execute } = useConvRestoreFn({
		folderId,
		conversationId,
		deselectAll
	});
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.RESTORE.id,
		icon: 'RestoreOutline',
		label: t('label.restore', 'Restore'),
		execute,
		canExecute
	};
};
