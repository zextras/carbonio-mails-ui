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

type ConvSetMsgReadFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
	isConversationRead: boolean;
	deselectAll?: () => void;
};

export const useConvSetReadFn = ({
	ids,
	deselectAll,
	folderId,
	isConversationRead
}: ConvSetMsgReadFunctionsParameter): ActionFn => {
	const dispatch = useAppDispatch();
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isConversationRead,
		[folderId, isConversationRead]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			dispatch(
				convAction({
					operation: 'read',
					ids
				})
			).then(() => {
				deselectAll && deselectAll();
			});
		}
	}, [canExecute, deselectAll, dispatch, ids]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvSetReadDescriptor = ({
	ids,
	deselectAll,
	folderId,
	isConversationRead
}: ConvSetMsgReadFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvSetReadFn({
		ids,
		deselectAll,
		folderId,
		isConversationRead
	});
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.MARK_AS_READ.id,
		icon: 'EmailReadOutline',
		label: t('action.mark_as_read', 'Mark as read'),
		execute,
		canExecute
	};
};
