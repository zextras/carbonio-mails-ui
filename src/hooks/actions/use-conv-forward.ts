/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { useForwardMsgFn } from './use-msg-forward';
import { ConversationActionsDescriptors, EditViewActions } from '../../constants';
import { ActionFn, UIActionDescriptor } from '../../types';
import { createEditBoard } from '../../views/app/detail-panel/edit/edit-view-board';

type ConvForwardAction = {
	firstMessageId: string;
	folderId: string;
	messagesLength: number;
};
export const useConvForwardFn = ({
	firstMessageId,
	folderId,
	messagesLength
}: ConvForwardAction): ActionFn => {
	const messageAction = useForwardMsgFn(firstMessageId, folderId);
	const canExecute = useCallback(
		(): boolean => messagesLength === 1 && messageAction.canExecute(),
		[messageAction, messagesLength]
	);

	const execute = useCallback(() => {
		if (canExecute()) {
			createEditBoard({
				action: EditViewActions.FORWARD,
				actionTargetId: firstMessageId
			});
		}
	}, [canExecute, firstMessageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvForwardDescriptor = ({
	firstMessageId,
	folderId,
	messagesLength
}: ConvForwardAction): UIActionDescriptor => {
	const { canExecute, execute } = useConvForwardFn({ firstMessageId, folderId, messagesLength });
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.FORWARD.id,
		icon: 'Forward',
		label: t('action.forward', 'Forward'),
		execute,
		canExecute
	};
};
