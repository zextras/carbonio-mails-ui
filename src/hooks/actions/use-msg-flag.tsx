/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ActionFn, UIActionDescriptor } from './use-redirect-msg';
import { MessageActionsDescriptors } from '../../constants';
import { msgAction } from '../../store/actions';
import { useAppDispatch } from '../redux';

export const useMsgFlagFn = (): ActionFn<Array<string>, never> => {
	const canExecute = useCallback((): boolean => true, []);
	const dispatch = useAppDispatch();

	const execute = useCallback(
		(ids: Array<string>): void => {
			dispatch(
				msgAction({
					operation: 'flag',
					ids
				})
			);
		},
		[dispatch]
	);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};
export const useMsgFlagDescriptor = (): UIActionDescriptor<Array<string>, never> => {
	const { canExecute, execute } = useMsgFlagFn();
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.FLAG.id,
		icon: 'FlagOutline',
		label: t('action.flag', 'Add flag'),
		execute,
		canExecute
	};
};
