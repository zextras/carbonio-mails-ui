/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { noop } from 'lodash';
import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from 'constants/index';
import { isTrash } from 'helpers/folders';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ActionFn, UIActionDescriptor } from 'types/index.d';
import { MoveMessage } from 'ui-actions/move-msg';

export const useMsgRestoreFn = ({
	folderId,
	messageId,
	deselectAll
}: {
	folderId: string;
	messageId: string;
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
						<MoveMessage
							folderId={folderId}
							selectedIDs={[messageId]}
							onClose={(): void => closeModal(modalId)}
							isRestore
							deselectAll={deselectAll ?? noop}
						/>
					)
				},
				true
			);
		}
	}, [canExecute, createModal, folderId, messageId, deselectAll, closeModal]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgRestoreDescriptor = ({
	folderId,
	messageId,
	deselectAll
}: {
	folderId: string;
	messageId: string;
	deselectAll: () => void;
}): UIActionDescriptor => {
	const { canExecute, execute } = useMsgRestoreFn({
		folderId,
		messageId,
		deselectAll
	});
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.RESTORE.id,
		icon: 'RestoreOutline',
		label: t('label.restore', 'Restore'),
		execute,
		canExecute
	};
};
