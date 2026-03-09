/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { MAILS_ROUTE, MessageActionsDescriptors } from 'constants/index';
import { isDraft } from 'helpers/folders';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';
import { ActionFn, UIActionDescriptor } from 'types/actions';

type MsgSetUnreadFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
	isMessageRead: boolean;
	shouldReplaceHistory?: boolean;
};

export const useMsgSetUnreadFn = ({
	ids,
	shouldReplaceHistory,
	folderId,
	isMessageRead
}: MsgSetUnreadFunctionsParameter): ActionFn => {
	const navigate = useNavigate();
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && isMessageRead,
		[folderId, isMessageRead]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			msgActionEmailStoreAction({
				operation: '!read',
				ids
			}).then((res) => {
				if (!('Fault' in res) && shouldReplaceHistory) {
					navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
				}
			});
		}
	}, [canExecute, folderId, ids, navigate, shouldReplaceHistory]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgSetUnreadDescriptor = ({
	ids,
	shouldReplaceHistory,
	folderId,
	isMessageRead
}: MsgSetUnreadFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useMsgSetUnreadFn({
		ids,
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
