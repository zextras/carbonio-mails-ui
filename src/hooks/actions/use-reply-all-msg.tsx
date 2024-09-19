/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { EditViewActions, MessageActionsDescriptors } from '../../constants';
import { ActionFn, UIActionDescriptor } from '../../types';
import { createEditBoard } from '../../views/app/detail-panel/edit/edit-view-board';

export const useReplyAllMsgFn = (messageId: string): ActionFn => {
	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback((): void => {
		createEditBoard({
			action: EditViewActions.REPLY_ALL,
			actionTargetId: messageId
		});
	}, [messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useReplyAllMsg = (messageId: string): UIActionDescriptor => {
	const { canExecute, execute } = useReplyAllMsgFn(messageId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.REPLY_ALL.id,
		icon: 'ReplyAll',
		label: t('action.reply_all', 'Reply all'),
		execute,
		canExecute
	};
};
