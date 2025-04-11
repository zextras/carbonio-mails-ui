/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from '../../constants';
import { ActionFn, UIActionDescriptor } from '../../types';
import { useStandalonePreview } from '../use-standalone-preview';

export const useConvPreviewOnSeparatedWindowFn = ({
	conversationId,
	folderId,
	subject
}: {
	conversationId: string;
	folderId: string;
	subject: string;
}): ActionFn => {
	const { isStandalonePreview, openConversationStandalonePreview } = useStandalonePreview();
	const canExecute = useCallback((): boolean => !isStandalonePreview(), [isStandalonePreview]);

	const execute = useCallback(() => {
		if (!canExecute()) {
			return;
		}

		openConversationStandalonePreview({ folderId, conversationId, subject });
	}, [canExecute, openConversationStandalonePreview, folderId, conversationId, subject]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvPreviewOnSeparatedWindowDescriptor = ({
	conversationId,
	folderId,
	subject
}: {
	conversationId: string;
	folderId: string;
	subject: string;
}): UIActionDescriptor => {
	const { canExecute, execute } = useConvPreviewOnSeparatedWindowFn({
		conversationId,
		folderId,
		subject
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
