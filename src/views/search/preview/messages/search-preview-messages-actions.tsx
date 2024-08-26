/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { t } from '@zextras/carbonio-shell-ui';

import { SearchMessagePreviewPanel } from './search-message-preview-panel';
import { MessageActionsDescriptors } from '../../../../constants';
import {
	ExtraWindowCreationParams,
	ExtraWindowsContextType,
	MessageAction,
	MessageActionReturnType
} from '../../../../types';

export const previewMessageOnSeparatedWindow = (
	messageId: string,
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
		children: <SearchMessagePreviewPanel messageId={messageId} messageActions={messageActions} />,
		title: subject,
		closeOnUnmount: false
	};
	createWindow(createWindowParams);
};

export function previewMessageOnSeparatedWindowAction(
	messageId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow'],
	messageActions: Array<MessageAction>
): MessageActionReturnType {
	const actDescriptor = MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW;
	return {
		id: actDescriptor.id,
		icon: 'ExternalLink',
		label: t('action.preview_on_separated_tab', 'Open in a new tab'),
		onClick: (): void => {
			previewMessageOnSeparatedWindow(messageId, subject, createWindow, messageActions);
		}
	};
}
