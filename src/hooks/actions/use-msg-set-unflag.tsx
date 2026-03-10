/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from 'constants/index';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';
import { ActionFn, UIActionDescriptor } from 'types/actions';

export const useMsgSetUnflagFn = (ids: Array<string>, isFlagged: boolean): ActionFn => {
	const canExecute = useCallback((): boolean => isFlagged, [isFlagged]);

	const execute = useCallback((): void => {
		if (canExecute()) {
			msgActionEmailStoreAction({
				operation: '!flag',
				ids
			});
		}
	}, [canExecute, ids]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};
export const useMsgSetUnflagDescriptor = (
	ids: Array<string>,
	isFlagged: boolean
): UIActionDescriptor => {
	const { canExecute, execute } = useMsgSetUnflagFn(ids, isFlagged);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.UNFLAG.id,
		icon: 'Flag',
		label: t('action.unflag', 'Remove flag'),
		execute,
		canExecute
	};
};
