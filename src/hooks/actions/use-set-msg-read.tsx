/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { replaceHistory } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from '../../constants';
import { msgAction } from '../../store/actions';
import { ActionFn, UIActionDescriptor } from '../../types';
import { useAppDispatch } from '../redux';

type SetMsgReadExecuteType = {
	ids: Array<string>;
	folderId?: string;
	shouldReplaceHistory?: boolean;
	deselectAll?: () => void;
};

export const useSetMsgReadFn = ({
	ids,
	deselectAll,
	shouldReplaceHistory,
	folderId
}: SetMsgReadExecuteType): ActionFn => {
	const canExecute = useCallback((): boolean => true, []);
	const dispatch = useAppDispatch();

	const execute = useCallback((): void => {
		dispatch(
			msgAction({
				operation: 'read',
				ids
			})
		).then((res) => {
			deselectAll && deselectAll();
			if (res.type.includes('fulfilled') && shouldReplaceHistory) {
				replaceHistory(`/folder/${folderId}`);
			}
		});
	}, [deselectAll, dispatch, folderId, ids, shouldReplaceHistory]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useSetMsgReadDescriptor = ({
	ids,
	deselectAll,
	shouldReplaceHistory,
	folderId
}: SetMsgReadExecuteType): UIActionDescriptor => {
	const { canExecute, execute } = useSetMsgReadFn({
		ids,
		deselectAll,
		shouldReplaceHistory,
		folderId
	});
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.MARK_AS_READ.id,
		icon: 'EmailReadOutline',
		label: t('action.mark_as_read', 'Mark as read'),
		execute,
		canExecute
	};
};
