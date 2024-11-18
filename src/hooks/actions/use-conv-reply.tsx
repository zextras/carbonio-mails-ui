/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { useMsgReplyFn } from './use-msg-reply';
import { ConversationActionsDescriptors } from '../../constants';
import { ActionFn, UIActionDescriptor } from '../../types';

type ConvReplyFunctionsParameter = {
	firstMessageId: string;
	messagesLength: number;
	folderId: string;
};

export const useConvReplyFn = ({
	firstMessageId,
	messagesLength,
	folderId
}: ConvReplyFunctionsParameter): ActionFn => {
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

export const useConvReplyDescriptor = ({
	firstMessageId,
	messagesLength,
	folderId
}: ConvReplyFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvReplyFn({ firstMessageId, folderId, messagesLength });
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.REPLY.id,
		icon: 'UndoOutline',
		label: t('action.reply', 'Reply'),
		execute,
		canExecute
	};
};
