/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { EditViewActions, MessageActionsDescriptors } from '../../constants';
import { isDraft, isSpam } from '../../helpers/folders';
import { ActionFn, UIActionDescriptor } from '../../types';
import { createEditBoard } from '../../views/app/detail-panel/edit/edit-view-board';

export const useMsgReplyAllFn = (messageId: string, folderId: string): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isSpam(folderId),
		[folderId]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			createEditBoard({
				action: EditViewActions.REPLY_ALL,
				actionTargetId: messageId
			});
		}
	}, [canExecute, messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgReplyAllDescriptor = (
	messageId: string,
	folderId: string
): UIActionDescriptor => {
	const { canExecute, execute } = useMsgReplyAllFn(messageId, folderId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.REPLY_ALL.id,
		icon: 'ReplyAll',
		label: t('action.reply_all', 'Reply all'),
		execute,
		canExecute
	};
};
