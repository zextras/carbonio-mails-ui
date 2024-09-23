/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from '../../constants';
import { isDraft, isTrash } from '../../helpers/folders';
import { ActionFn, UIActionDescriptor } from '../../types';

export const useConvShowOriginalFn = (conversationId: string, folderId: string): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isTrash(folderId),
		[folderId]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			window.open(`/service/home/~/?auth=co&view=text&id=${conversationId}`, '_blank');
		}
	}, [canExecute, conversationId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvShowOriginalDescriptor = (
	conversationId: string,
	folderId: string
): UIActionDescriptor => {
	const { canExecute, execute } = useConvShowOriginalFn(conversationId, folderId);
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.SHOW_SOURCE.id,
		icon: 'CodeOutline',
		label: t('action.show_original', 'Show original'),
		execute,
		canExecute
	};
};
