/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { createEditBoard } from '../../views/editor/edit-view-board';
import { EditViewActions, MessageActionsDescriptors } from 'constants/index';
import { isDraft, isSpam } from 'helpers/folders';
import { ActionFn, UIActionDescriptor } from 'types/index.d';

export const useMsgReplyFn = (messageId: string, folderId: string): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isSpam(folderId),
		[folderId]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			createEditBoard({
				action: EditViewActions.REPLY,
				actionTargetId: messageId
			});
		}
	}, [canExecute, messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgReplyDescriptor = (messageId: string, folderId: string): UIActionDescriptor => {
	const { canExecute, execute } = useMsgReplyFn(messageId, folderId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.REPLY.id,
		icon: 'UndoOutline',
		label: t('action.reply', 'Reply'),
		execute,
		canExecute
	};
};
