/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from 'constants/index';
import { isTrash } from 'helpers/folders';
import { useConvActionTargetConstraint } from 'hooks/use-conv-action-target-constraint';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { MoveConversation } from 'ui-actions/move-conv';

export const useConvMoveToFolderFn = ({
	folderId,
	ids,
	onActionComplete
}: {
	folderId: string;
	ids: Array<string>;
	onActionComplete?: (conversationsIds: Array<string>) => void;
}): ActionFn => {
	const { createModal, closeModal } = useUiUtilities();
	const tcon = useConvActionTargetConstraint();
	const canExecute = useCallback((): boolean => !isTrash(folderId), [folderId]);

	const execute = useCallback((): void => {
		if (!canExecute()) {
			return;
		}

		const id = Date.now().toString();
		createModal(
			{
				id,
				maxHeight: '90vh',
				size: 'medium',
				onClose: (): void => {
					closeModal(id);
				},
				children: (
					<MoveConversation
						folderId={folderId}
						selectedIDs={ids}
						onClose={(): void => closeModal(id)}
						isRestore={false}
						onMoveComplete={onActionComplete}
						tcon={tcon}
					/>
				)
			},
			true
		);
	}, [canExecute, createModal, folderId, ids, onActionComplete, closeModal, tcon]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvMoveToFolderDescriptor = ({
	folderId,
	ids,
	onActionComplete
}: {
	folderId: string;
	ids: Array<string>;
	onActionComplete?: (conversationsIds: Array<string>) => void;
}): UIActionDescriptor => {
	const { canExecute, execute } = useConvMoveToFolderFn({
		folderId,
		ids,
		onActionComplete
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
