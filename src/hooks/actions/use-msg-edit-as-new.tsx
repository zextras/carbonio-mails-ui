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

export const useMsgEditAsNewFn = (messageId: string): ActionFn => {
	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback((): void => {
		createEditBoard({
			action: EditViewActions.EDIT_AS_NEW,
			actionTargetId: messageId
		});
	}, [messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgEditAsNewDescriptor = (messageId: string): UIActionDescriptor => {
	const { canExecute, execute } = useMsgEditAsNewFn(messageId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.EDIT_AS_NEW.id,
		icon: 'Edit2Outline',
		label: t('action.edit_as_new', 'Edit as new'),
		execute,
		canExecute
	};
};
