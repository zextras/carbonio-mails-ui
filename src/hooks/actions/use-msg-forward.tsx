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

export const useForwardMsgFn = (messageId: string): ActionFn => {
	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback(() => {
		createEditBoard({
			action: EditViewActions.FORWARD,
			actionTargetId: messageId
		});
	}, [messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useForwardMsgDescriptor = (messageId: string): UIActionDescriptor => {
	const { canExecute, execute } = useForwardMsgFn(messageId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.FORWARD.id,
		icon: 'Forward',
		label: t('action.forward', 'Forward'),
		execute,
		canExecute
	};
};
