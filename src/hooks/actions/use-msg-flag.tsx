/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from '../../constants';
import { msgAction } from '../../store/actions';
import { ActionFn, UIActionDescriptor } from '../../types';
import { useAppDispatch } from '../redux';

export const useMsgFlagFn = (ids: Array<string>): ActionFn => {
	const canExecute = useCallback((): boolean => true, []);
	const dispatch = useAppDispatch();

	const execute = useCallback((): void => {
		dispatch(
			msgAction({
				operation: 'flag',
				ids
			})
		);
	}, [dispatch, ids]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};
export const useMsgFlagDescriptor = (ids: Array<string>): UIActionDescriptor => {
	const { canExecute, execute } = useMsgFlagFn(ids);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.FLAG.id,
		icon: 'FlagOutline',
		label: t('action.flag', 'Add flag'),
		execute,
		canExecute
	};
};
