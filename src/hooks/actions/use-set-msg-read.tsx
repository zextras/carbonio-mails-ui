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

type MsgSetReadFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
	isMessageRead: boolean;
	shouldReplaceHistory?: boolean;
	deselectAll?: () => void;
};

export const useMsgSetAsReadFn = ({
	ids,
	deselectAll,
	shouldReplaceHistory,
	folderId,
	isMessageRead
}: MsgSetReadFunctionsParameter): ActionFn => {
	const dispatch = useAppDispatch();
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isMessageRead,
		[folderId, isMessageRead]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
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
		}
	}, [canExecute, deselectAll, dispatch, folderId, ids, shouldReplaceHistory]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgSetAsReadDescriptor = ({
	ids,
	deselectAll,
	shouldReplaceHistory,
	folderId,
	isMessageRead
}: MsgSetReadFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useMsgSetAsReadFn({
		ids,
		deselectAll,
		shouldReplaceHistory,
		folderId,
		isMessageRead
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
