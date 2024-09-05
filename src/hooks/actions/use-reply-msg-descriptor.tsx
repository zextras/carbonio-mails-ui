/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { UIActionDescriptor, ActionFn } from './use-redirect-msg-descriptor';
import { EditViewActions, MessageActionsDescriptors } from '../../constants';
import { createEditBoard } from '../../views/app/detail-panel/edit/edit-view-board';

export const useReplyMsgFn = (id: string): ActionFn<never, never> => {
	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback(
		(ev): void => {
			if (ev) ev.preventDefault();
			createEditBoard({
				action: EditViewActions.REPLY,
				actionTargetId: `${id}`
			});
		},
		[id]
	);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useReplyMsgDescriptor = (id: string): UIActionDescriptor<never, never> => {
	const { canExecute, execute } = useReplyMsgFn(id);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.REPLY.id,
		icon: 'UndoOutline',
		label: t('action.reply', 'Reply'),
		execute,
		canExecute
	};
};
