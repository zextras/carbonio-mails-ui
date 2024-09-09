/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { replaceHistory } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { ActionFn, UIActionDescriptor } from './use-redirect-msg';
import { MessageActionsDescriptors } from '../../constants';
import { msgAction } from '../../store/actions';
import { useAppDispatch } from '../redux';

type SetMsgReadExecuteType = {
	ids: Array<string>;
	folderId?: string;
	shouldReplaceHistory?: boolean;
	deselectAll?: () => void;
};

export const useSetMsgUnreadFn = (): ActionFn<SetMsgReadExecuteType, never> => {
	const canExecute = useCallback((): boolean => true, []);
	const dispatch = useAppDispatch();

	const execute = useCallback(
		({ ids, deselectAll, shouldReplaceHistory, folderId }: SetMsgReadExecuteType): void => {
			dispatch(
				msgAction({
					operation: '!read',
					ids
				})
			).then((res) => {
				deselectAll && deselectAll();
				if (res.type.includes('fulfilled') && shouldReplaceHistory) {
					replaceHistory(`/folder/${folderId}`);
				}
			});
		},
		[dispatch]
	);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useSetMsgUnreadDescriptor = (): UIActionDescriptor<SetMsgReadExecuteType, never> => {
	const { canExecute, execute } = useSetMsgUnreadFn();
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.MARK_AS_UNREAD.id,
		icon: 'EmailOutline',
		label: t('action.mark_as_unread', 'Mark as unread'),
		execute,
		canExecute
	};
};
