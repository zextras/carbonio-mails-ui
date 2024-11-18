/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from '../../constants';
import { ActionFn, ExtraWindowCreationParams, UIActionDescriptor } from '../../types';
import { useGlobalExtraWindowManager } from '../../views/app/extra-windows/global-extra-window-manager';
import { useExtraWindow } from '../../views/app/extra-windows/use-extra-window';

export const useMsgPreviewOnSeparatedWindowFn = ({
	messageId,
	subject,
	messagePreviewFactory
}: {
	messageId: string;
	subject: string;
	messagePreviewFactory: () => React.JSX.Element;
}): ActionFn => {
	const { createWindow } = useGlobalExtraWindowManager();
	const { isInsideExtraWindow } = useExtraWindow();
	const canExecute = useCallback((): boolean => !isInsideExtraWindow, [isInsideExtraWindow]);

	const execute = useCallback(() => {
		if (canExecute()) {
			if (!createWindow) {
				return;
			}

			const createWindowParams: ExtraWindowCreationParams = {
				name: `message-${messageId}`,
				returnComponent: false,
				children: messagePreviewFactory(),
				title: subject,
				closeOnUnmount: false
			};
			createWindow(createWindowParams);
		}
	}, [canExecute, createWindow, messageId, messagePreviewFactory, subject]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgPreviewOnSeparatedWindowDescriptor = ({
	messageId,
	subject,
	messagePreviewFactory
}: {
	messageId: string;
	subject: string;
	messagePreviewFactory: () => React.JSX.Element;
}): UIActionDescriptor => {
	const { canExecute, execute } = useMsgPreviewOnSeparatedWindowFn({
		messageId,
		subject,
		messagePreviewFactory
	});
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW.id,
		icon: 'ExternalLink',
		label: t('action.preview_on_separated_tab', 'Open in a new tab'),
		execute,
		canExecute
	};
};
