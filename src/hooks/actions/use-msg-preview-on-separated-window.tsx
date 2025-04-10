/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors, MSG_PREVIEW_ROUTE } from '../../constants';
import { ActionFn, UIActionDescriptor } from '../../types';
import { getLocationOrigin } from '../../views/app/detail-panel/preview/utils';
import { useGlobalExtraWindowManager } from '../../views/app/extra-windows/global-extra-window-manager';
import { useExtraWindow } from '../../views/app/extra-windows/use-extra-window';

export const useMsgPreviewOnSeparatedWindowFn = ({
	messageId,
	folderId,
	subject
}: {
	messageId: string;
	folderId: string;
	subject: string;
}): ActionFn => {
	const { createWindow } = useGlobalExtraWindowManager();
	const { isInsideExtraWindow } = useExtraWindow();
	const canExecute = useCallback((): boolean => !isInsideExtraWindow, [isInsideExtraWindow]);

	const execute = useCallback(() => {
		if (canExecute()) {
			if (!createWindow) {
				return;
			}
			window.open(
				`${getLocationOrigin()}/carbonio/${MSG_PREVIEW_ROUTE}/folder/${folderId}/message/${messageId}`
			);
		}
	}, [canExecute, createWindow, messageId, folderId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgPreviewOnSeparatedWindowDescriptor = ({
	messageId,
	folderId,
	subject
}: {
	messageId: string;
	folderId: string;
	subject: string;
}): UIActionDescriptor => {
	const { canExecute, execute } = useMsgPreviewOnSeparatedWindowFn({
		messageId,
		folderId,
		subject
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
