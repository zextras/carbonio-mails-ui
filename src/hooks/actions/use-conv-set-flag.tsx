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

export const useConvSetFlagFn = (ids: Array<string>, isFlagged: boolean): ActionFn => {
	const canExecute = useCallback((): boolean => !isFlagged, [isFlagged]);

	const execute = useCallback((): void => {
		if (canExecute()) {
			convAction({
				operation: 'flag',
				ids
			});
		}
	}, [canExecute, ids]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};
export const useConvSetFlagDescriptor = (
	ids: Array<string>,
	isFlagged: boolean
): UIActionDescriptor => {
	const { canExecute, execute } = useConvSetFlagFn(ids, isFlagged);
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.FLAG.id,
		icon: 'FlagOutline',
		label: t('action.flag', 'Add flag'),
		execute,
		canExecute
	};
};
