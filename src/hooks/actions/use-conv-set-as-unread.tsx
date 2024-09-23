/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from '../../constants';
import { isDraft } from '../../helpers/folders';
import { convAction } from '../../store/actions';
import { ActionFn, UIActionDescriptor } from '../../types';
import { useAppDispatch } from '../redux';

type SetMsgReadExecuteType = {
	ids: Array<string>;
	folderId: string;
	isConversationRead: boolean;
	deselectAll?: () => void;
};

export const useConvSetAsUnreadFn = ({
	ids,
	deselectAll,
	folderId,
	isConversationRead
}: SetMsgReadExecuteType): ActionFn => {
	const dispatch = useAppDispatch();
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && isConversationRead,
		[folderId, isConversationRead]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			dispatch(
				convAction({
					operation: '!read',
					ids
				})
			).then(() => {
				deselectAll && deselectAll();
			});
		}
	}, [canExecute, deselectAll, dispatch, ids]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvSetAsUnread = ({
	ids,
	deselectAll,
	folderId,
	isConversationRead
}: SetMsgReadExecuteType): UIActionDescriptor => {
	const { canExecute, execute } = useConvSetAsUnreadFn({
		ids,
		deselectAll,
		folderId,
		isConversationRead
	});
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.MARK_AS_UNREAD.id,
		icon: 'EmailOutline',
		label: t('action.mark_as_unread', 'Mark as unread'),
		execute,
		canExecute
	};
};
