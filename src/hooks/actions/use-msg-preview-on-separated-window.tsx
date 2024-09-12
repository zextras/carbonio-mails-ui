/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ActionFn, UIActionDescriptor } from './use-redirect-msg';
import { MessageActionsDescriptors } from '../../constants';
import { ExtraWindowCreationParams, ExtraWindowsContextType } from '../../types';
import { MessagePreviewPanel } from '../../views/app/detail-panel/message-preview-panel';

export const useMsgCreateAppointmentFn = ({
	messageId,
	folderId,
	messageActions,
	subject,
	createWindow
}: {
	messageId: string;
	folderId: string;
	subject: string;
	messageActions: UIActionDescriptor;
	createWindow: ExtraWindowsContextType['createWindow'];
}): ActionFn => {
	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback(() => {
		if (!createWindow) {
			return;
		}

		const createWindowParams: ExtraWindowCreationParams = {
			name: `message-${messageId}`,
			returnComponent: false,
			children: (
				<MessagePreviewPanel
					messageId={messageId}
					folderId={folderId}
					messageActions={messageActions}
				/>
			),
			title: subject,
			closeOnUnmount: false
		};
		createWindow(createWindowParams);
	}, [createWindow, folderId, messageActions, messageId, subject]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgPreviewOnSeparatedWindowDescriptor = ({
	messageId,
	folderId,
	messageActions,
	subject,
	createWindow
}: {
	messageId: string;
	folderId: string;
	subject: string;
	messageActions: UIActionDescriptor;
	createWindow: ExtraWindowsContextType['createWindow'];
}): UIActionDescriptor => {
	const { canExecute, execute } = useMsgCreateAppointmentFn({
		messageId,
		folderId,
		messageActions,
		subject,
		createWindow
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
