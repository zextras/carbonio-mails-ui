/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { useMsgReplyFn } from './use-reply-msg';
import { ConversationActionsDescriptors } from '../../constants';
import { ActionFn, UIActionDescriptor } from '../../types';

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
	const messageReplyAction = useMsgReplyFn(firstMessageId, folderId);

	const canExecute = useCallback(
		(): boolean => messagesLength === 1 && messageReplyAction.canExecute(),
		[messageReplyAction, messagesLength]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			messageReplyAction.execute();
		}
	}, [canExecute, messageReplyAction]);

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
