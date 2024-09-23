/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from '../../constants';
import { convAction } from '../../store/actions';
import { ActionFn, UIActionDescriptor } from '../../types';
import { useAppDispatch } from '../redux';

export const useConvUnsetFlagFn = (ids: Array<string>, isFlagged: boolean): ActionFn => {
	const canExecute = useCallback((): boolean => isFlagged, [isFlagged]);
	const dispatch = useAppDispatch();

	const execute = useCallback((): void => {
		if (canExecute()) {
			dispatch(
				convAction({
					operation: '!flag',
					ids
				})
			);
		}
	}, [canExecute, dispatch, ids]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};
export const useConvUnsetFlagDescriptor = (
	ids: Array<string>,
	isFlagged: boolean
): UIActionDescriptor => {
	const { canExecute, execute } = useConvUnsetFlagFn(ids, isFlagged);
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.UNFLAG.id,
		icon: 'Flag',
		label: t('action.flag', 'Remove flag'),
		execute,
		canExecute
	};
};
