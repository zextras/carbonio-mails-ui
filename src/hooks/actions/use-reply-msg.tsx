/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { HoverMessageActionsType } from './use-hover-message-actions';
import { UIActionDescriptor, ActionFn } from './use-redirect-msg';
import { EditViewActions, MessageActionsDescriptors } from '../../constants';
import { createEditBoard } from '../../views/app/detail-panel/edit/edit-view-board';

export const useReplyMsgFn = (
	messageId: HoverMessageActionsType['messageId']
): ActionFn<string, undefined> => {
	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback((): void => {
		createEditBoard({
			action: EditViewActions.REPLY,
			actionTargetId: messageId
		});
	}, [messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useReplyMsgDescriptor = (
	messageId: HoverMessageActionsType['messageId']
): UIActionDescriptor<string, undefined> => {
	const { canExecute, execute } = useReplyMsgFn(messageId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.REPLY.id,
		icon: 'UndoOutline',
		label: t('action.reply', 'Reply'),
		execute,
		canExecute
	};
};
