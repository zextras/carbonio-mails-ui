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

type MsgSetReadFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
	isMessageRead: boolean;
	shouldReplaceHistory?: boolean;
	deselectAll?: () => void;
};

export const useMsgSetReadFn = ({
	ids,
	deselectAll,
	shouldReplaceHistory,
	folderId,
	isMessageRead
}: MsgSetReadFunctionsParameter): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isMessageRead,
		[folderId, isMessageRead]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			msgActionSoapApi({ operation: 'read', ids }).then((res) => {
				deselectAll && deselectAll();
				if (!('Fault' in res) && shouldReplaceHistory) {
					replaceHistory(`/folder/${folderId}`);
				}
			});
		}
	}, [canExecute, deselectAll, folderId, ids, shouldReplaceHistory]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgSetReadDescriptor = ({
	ids,
	deselectAll,
	shouldReplaceHistory,
	folderId,
	isMessageRead
}: MsgSetReadFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useMsgSetReadFn({
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
