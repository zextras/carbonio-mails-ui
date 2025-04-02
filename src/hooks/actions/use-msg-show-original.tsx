/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from '../../constants';
import { isDraft, isTrash } from '../../helpers/folders';
import { ActionFn, UIActionDescriptor } from '../../types';

export const useMsgShowOriginalFn = (messageId: string, folderId: string): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isTrash(folderId),
		[folderId]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			window.open(`/service/home/~/?auth=co&view=text&id=${messageId}`, '_blank');
		}
	}, [canExecute, messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgShowOriginalDescriptor = (
	messageId: string,
	folderId: string
): UIActionDescriptor => {
	const { canExecute, execute } = useMsgShowOriginalFn(messageId, folderId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.SHOW_SOURCE.id,
		icon: 'CodeOutline',
		label: t('action.show_original', 'Show original'),
		execute,
		canExecute
	};
};
