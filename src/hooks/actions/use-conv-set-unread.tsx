/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from 'constants/index';
import { isDraft } from 'helpers/folders';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { ActionFn, UIActionDescriptor } from 'types/actions';

type ConvSetUnreadFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
	isConversationRead: boolean;
};

export const useConvSetUnreadFn = ({
	ids,
	folderId,
	isConversationRead
}: ConvSetUnreadFunctionsParameter): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && isConversationRead,
		[folderId, isConversationRead]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			convActionEmailStoreAction({
				operation: '!read',
				ids
			});
		}
	}, [canExecute, ids]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvSetUnreadDescriptor = ({
	ids,
	folderId,
	isConversationRead
}: ConvSetUnreadFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvSetUnreadFn({
		ids,
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
