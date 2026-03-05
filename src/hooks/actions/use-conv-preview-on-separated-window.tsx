/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from 'constants/index';
import { isFocusModeMailView, openConversationStandalonePreview } from 'helpers/external-tabs';
import { ActionFn, UIActionDescriptor } from 'types/actions';

export const useConvPreviewOnSeparatedWindowFn = ({
	conversationId,
	folderId
}: {
	conversationId: string;
	folderId: string;
}): ActionFn => {
	const canExecute = useCallback((): boolean => !isFocusModeMailView(), []);

	const execute = useCallback(() => {
		if (!canExecute()) {
			return;
		}

		openConversationStandalonePreview({ folderId, conversationId });
	}, [canExecute, folderId, conversationId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvPreviewOnSeparatedWindowDescriptor = ({
	conversationId,
	folderId
}: {
	conversationId: string;
	folderId: string;
}): UIActionDescriptor => {
	const { canExecute, execute } = useConvPreviewOnSeparatedWindowFn({
		conversationId,
		folderId
	});
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW.id,
		icon: 'ExternalLink',
		label: t('action.preview_on_separated_tab', 'Open in a new tab'),
		execute,
		canExecute
	};
};
