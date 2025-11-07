/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useInSearchModule } from '../../ui-actions/utils';
import { ConversationActionsDescriptors, MAILS_ROUTE, SEARCH_ROUTE } from 'constants/index';
import { isDraft } from 'helpers/folders';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { ActionFn, UIActionDescriptor } from 'types/index.d';

type ConvSetUnreadFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
	isConversationRead: boolean;
	shouldReplaceHistory?: boolean;
};

export const useConvSetUnreadFn = ({
	ids,
	folderId,
	isConversationRead,
	shouldReplaceHistory
}: ConvSetUnreadFunctionsParameter): ActionFn => {
	const navigate = useNavigate();
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && isConversationRead,
		[folderId, isConversationRead]
	);

	const isSearchContext = useInSearchModule();
	const execute = useCallback((): void => {
		if (canExecute()) {
			convActionEmailStoreAction({
				operation: '!read',
				ids
			}).then((res) => {
				if (!('Fault' in res) && shouldReplaceHistory) {
					if (isSearchContext) {
						navigate(`/${SEARCH_ROUTE}`, { replace: true });
						return;
					}
					navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
				}
			});
		}
	}, [canExecute, folderId, ids, isSearchContext, navigate, shouldReplaceHistory]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvSetUnreadDescriptor = ({
	ids,
	folderId,
	isConversationRead,
	shouldReplaceHistory
}: ConvSetUnreadFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvSetUnreadFn({
		ids,
		folderId,
		isConversationRead,
		shouldReplaceHistory
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
