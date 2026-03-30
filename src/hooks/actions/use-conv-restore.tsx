/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from 'constants/index';
import { isTrash } from 'helpers/folders';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { MoveConversation } from 'ui-actions/move-conv';

export const useConvRestoreFn = ({
	folderId,
	conversationId
}: {
	folderId: string;
	conversationId: string;
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
					onClose: (): void => {
						closeModal(modalId);
					},
					children: (
						<MoveConversation
							folderId={folderId}
							selectedIDs={[conversationId]}
							onClose={(): void => closeModal(modalId)}
							isRestore
						/>
					)
				},
				true
			);
		}
	}, [canExecute, createModal, folderId, conversationId, closeModal]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvRestoreDescriptor = ({
	folderId,
	conversationId
}: {
	folderId: string;
	conversationId: string;
}): UIActionDescriptor => {
	const { canExecute, execute } = useConvRestoreFn({
		folderId,
		conversationId
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
