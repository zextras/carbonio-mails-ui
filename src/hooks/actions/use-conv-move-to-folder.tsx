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
import { ActionFn, UIActionDescriptor } from 'types/index.d';
import { MoveConversation } from 'ui-actions/move-conv';

export const useConvMoveToFolderFn = ({
	folderId,
	ids
}: {
	folderId: string;
	ids: Array<string>;
}): ActionFn => {
	const { createModal, closeModal } = useUiUtilities();
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
				children: (
					<MoveConversation
						folderId={folderId}
						selectedIDs={ids}
						onClose={(): void => closeModal(id)}
						isRestore={false}
					/>
				)
			},
			true
		);
	}, [canExecute, createModal, folderId, ids, closeModal]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvMoveToFolderDescriptor = ({
	folderId,
	ids
}: {
	folderId: string;
	ids: Array<string>;
}): UIActionDescriptor => {
	const { canExecute, execute } = useConvMoveToFolderFn({
		folderId,
		ids
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
