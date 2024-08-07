/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { t } from '@zextras/carbonio-shell-ui';

import { MessageActionsDescriptors } from '../constants';
import {
	ConvActionReturnType,
	ExtraWindowCreationParams,
	ExtraWindowsContextType,
	type MessageAction
} from '../types';
import { MessagePreviewPanel } from '../views/app/detail-panel/message-preview-panel';

export const previewOnSeparatedWindow = (
	messageId: string,
	folderId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow'],
	messageActions: Array<MessageAction>
): void => {
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
};

export function previewMessageOnSeparatedWindow(
	messageId: string,
	folderId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow'],
	messageActions: Array<MessageAction>
): ConvActionReturnType {
	const actDescriptor = MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW;
	return {
		id: actDescriptor.id,
		icon: 'ExternalLink',
		label: t('action.preview_on_separated_tab', 'Open in a new tab'),
		onClick: (): void => {
			previewOnSeparatedWindow(messageId, folderId, subject, createWindow, messageActions);
		}
	};
}
