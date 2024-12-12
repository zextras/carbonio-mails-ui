/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { replaceHistory } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { msgActionSoapApi } from '../../api/msg-action';
import { MessageActionsDescriptors } from '../../constants';
import { isDraft } from '../../helpers/folders';
import { ActionFn, UIActionDescriptor } from '../../types';

type MsgSetUnreadFunctionsParameter = {
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
}: MsgSetUnreadFunctionsParameter): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && isMessageRead,
		[folderId, isMessageRead]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			msgActionSoapApi({
				operation: '!read',
				ids
			}).then((res) => {
				deselectAll?.();
				if (!('Fault' in res) && shouldReplaceHistory) {
					replaceHistory(`/folder/${folderId}`);
				}
			});
		}
	}, [canExecute, deselectAll, folderId, ids, shouldReplaceHistory]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgSetUnreadDescriptor = ({
	ids,
	deselectAll,
	shouldReplaceHistory,
	folderId,
	isMessageRead
}: MsgSetUnreadFunctionsParameter): UIActionDescriptor => {
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
