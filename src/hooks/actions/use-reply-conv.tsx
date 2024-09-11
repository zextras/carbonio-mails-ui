/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ActionFn, UIActionDescriptor } from './use-redirect-msg';
import { ConversationActionsDescriptors, EditViewActions } from '../../constants';
import { isDraft, isSpam } from '../../helpers/folders';
import { createEditBoard } from '../../views/app/detail-panel/edit/edit-view-board';

type ReplyConvAction = {
	firstMessageId: string;
	messagesLength: number;
	folderId: string;
};

export const useReplyConvFn = ({
	firstMessageId,
	messagesLength,
	folderId
}: ReplyConvAction): ActionFn => {
	const canExecute = useCallback(
		(): boolean => messagesLength === 1 || isDraft(folderId) || isSpam(folderId),
		[folderId, messagesLength]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			createEditBoard({
				action: EditViewActions.REPLY,
				actionTargetId: firstMessageId
			});
		}
	}, [canExecute, firstMessageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useReplyConvDescriptor = ({
	firstMessageId,
	messagesLength,
	folderId
}: ReplyConvAction): UIActionDescriptor => {
	const { canExecute, execute } = useReplyConvFn({ firstMessageId, folderId, messagesLength });
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.REPLY.id,
		icon: 'UndoOutline',
		label: t('action.reply', 'Reply'),
		execute,
		canExecute
	};
};
