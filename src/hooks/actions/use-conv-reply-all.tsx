/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { useMsgReplyAllFn } from './use-msg-reply-all';
import { ConversationActionsDescriptors, EditViewActions } from '../../constants';
import { ActionFn, UIActionDescriptor } from '../../types';
import { createEditBoard } from '../../views/app/detail-panel/edit/edit-view-board';

type ConvReplyAllFunctionsParameter = {
	firstMessageId: string;
	messagesLength: number;
	folderId: string;
};

export const useConvReplyAllFn = ({
	firstMessageId,
	folderId,
	messagesLength
}: ConvReplyAllFunctionsParameter): ActionFn => {
	const replyAllMessageAction = useMsgReplyAllFn(firstMessageId, folderId);
	const canExecute = useCallback(
		(): boolean => messagesLength === 1 && replyAllMessageAction.canExecute(),
		[messagesLength, replyAllMessageAction]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			createEditBoard({
				action: EditViewActions.REPLY_ALL,
				actionTargetId: firstMessageId
			});
		}
	}, [canExecute, firstMessageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvReplyAllDescriptor = ({
	firstMessageId,
	folderId,
	messagesLength
}: ConvReplyAllFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvReplyAllFn({ firstMessageId, folderId, messagesLength });
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.REPLY_ALL.id,
		icon: 'ReplyAll',
		label: t('action.reply_all', 'Reply all'),
		execute,
		canExecute
	};
};
