/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { replaceHistory } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from '../../constants';
import { isDraft } from '../../helpers/folders';
import { msgAction } from '../../store/actions';
import { ActionFn, UIActionDescriptor } from '../../types';
import { useAppDispatch } from '../redux';

type MsgSetReadFnParameters = {
	ids: Array<string>;
	folderId: string;
	isMessageRead: boolean;
	shouldReplaceHistory?: boolean;
	deselectAll?: () => void;
};

export const useMsgSetUnreadFn = ({
	ids,
	deselectAll,
	shouldReplaceHistory,
	folderId,
	isMessageRead
}: MsgSetReadFnParameters): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && isMessageRead,
		[folderId, isMessageRead]
	);
	const dispatch = useAppDispatch();

	const execute = useCallback((): void => {
		if (canExecute()) {
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
		}
	}, [canExecute, deselectAll, dispatch, folderId, ids, shouldReplaceHistory]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgSetUnreadDescriptor = ({
	ids,
	deselectAll,
	shouldReplaceHistory,
	folderId,
	isMessageRead
}: MsgSetReadFnParameters): UIActionDescriptor => {
	const { canExecute, execute } = useMsgSetUnreadFn({
		ids,
		deselectAll,
		shouldReplaceHistory,
		folderId,
		isMessageRead
	});
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.MARK_AS_UNREAD.id,
		icon: 'EmailOutline',
		label: t('action.mark_as_unread', 'Mark as unread'),
		execute,
		canExecute
	};
};
