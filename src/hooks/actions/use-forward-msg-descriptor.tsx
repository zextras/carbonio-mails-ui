/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ActionFn, UIActionDescriptor } from './use-redirect-msg-descriptor';
import { EditViewActions, MessageActionsDescriptors } from '../../constants';
import { createEditBoard } from '../../views/app/detail-panel/edit/edit-view-board';

export const useForwardMsgFn = (): ActionFn<never, never> => {
	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback((id) => {
		createEditBoard({
			action: EditViewActions.FORWARD,
			actionTargetId: id
		});
	}, []);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useForwardMsgDescriptor = (): UIActionDescriptor<never, never> => {
	const { canExecute, execute } = useForwardMsgFn();
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.FORWARD.id,
		icon: 'Forward',
		label: t('action.forward', 'Forward'),
		execute,
		canExecute
	};
};
