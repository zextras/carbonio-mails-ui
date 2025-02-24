/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors, MSG_PREVIEW_ROUTE } from '../../constants';
import { ActionFn, ExtraWindowCreationParams, UIActionDescriptor } from '../../types';
import { getLocationOrigin } from '../../views/app/detail-panel/preview/utils';
import { useGlobalExtraWindowManager } from '../../views/app/extra-windows/global-extra-window-manager';
import { useExtraWindow } from '../../views/app/extra-windows/use-extra-window';

export const useConvPreviewOnSeparatedWindowFn = ({
	conversationId,
	folderId,
	subject
}: {
	conversationId: string;
	folderId: string;
	subject: string;
}): ActionFn => {
	const { createWindow } = useGlobalExtraWindowManager();
	const { isInsideExtraWindow } = useExtraWindow();
	const canExecute = useCallback((): boolean => !isInsideExtraWindow, [isInsideExtraWindow]);

	const execute = useCallback(() => {
		if (!createWindow) {
			return;
		}

		if (!canExecute()) {
			return;
		}

		const createWindowParams: ExtraWindowCreationParams = {
			name: `conversation-${conversationId}`,
			returnComponent: false,
			url: `${getLocationOrigin()}/carbonio/${MSG_PREVIEW_ROUTE}/folder/${folderId}/conversation/${conversationId}`,
			title: subject,
			closeOnUnmount: false
		};
		createWindow(createWindowParams);
	}, [createWindow, canExecute, conversationId, folderId, subject]);

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
