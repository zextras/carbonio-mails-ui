/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from '../../constants';
import { ActionFn, ExtraWindowCreationParams, UIActionDescriptor } from '../../types';
import { MessagePreviewPanel } from '../../views/app/detail-panel/message-preview-panel';
import { useGlobalExtraWindowManager } from '../../views/app/extra-windows/global-extra-window-manager';

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

	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback(() => {
		if (!createWindow) {
			return;
		}

		const createWindowParams: ExtraWindowCreationParams = {
			name: `message-${messageId}`,
			returnComponent: false,
			children: <MessagePreviewPanel messageId={messageId} folderId={folderId} />,
			title: subject,
			closeOnUnmount: false
		};
		createWindow(createWindowParams);
	}, [createWindow, folderId, messageId, subject]);

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
