/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from '../../constants';
import { ActionFn, ExtraWindowCreationParams, UIActionDescriptor } from '../../types';
import { useGlobalExtraWindowManager } from '../../views/app/extra-windows/global-extra-window-manager';
import { useExtraWindow } from '../../views/app/extra-windows/use-extra-window';

export const useConvPreviewOnSeparatedWindowFn = ({
	conversationId,
	subject,
	conversationPreviewFactory
}: {
	conversationId: string;
	subject: string;
	conversationPreviewFactory: () => React.JSX.Element;
}): ActionFn => {
	const { createWindow } = useGlobalExtraWindowManager();
	const { isInsideExtraWindow } = useExtraWindow();
	const canExecute = useCallback((): boolean => !isInsideExtraWindow, [isInsideExtraWindow]);

	const execute = useCallback(() => {
		if (!createWindow) {
			return;
		}

		const createWindowParams: ExtraWindowCreationParams = {
			name: `conversation-${conversationId}`,
			returnComponent: false,
			children: conversationPreviewFactory(),
			title: subject,
			closeOnUnmount: false
		};
		createWindow(createWindowParams);
	}, [createWindow, conversationId, conversationPreviewFactory, subject]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvPreviewOnSeparatedWindowDescriptor = ({
	conversationId,
	subject,
	conversationPreviewFactory
}: {
	conversationId: string;
	subject: string;
	conversationPreviewFactory: () => React.JSX.Element;
}): UIActionDescriptor => {
	const { canExecute, execute } = useConvPreviewOnSeparatedWindowFn({
		conversationId,
		subject,
		conversationPreviewFactory
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
