/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { t } from '@zextras/carbonio-shell-ui';

import { SearchConversationPreviewPanelContainer } from './search-conversation-preview-panel';
import { ConversationActionsDescriptors } from '../../../../constants';
import type {
	ConvActionReturnType,
	ExtraWindowCreationParams,
	ExtraWindowsContextType
} from '../../../../types';

const previewConversationOnSeparatedWindow = (
	conversationId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow']
): void => {
	if (!createWindow) {
		return;
	}

	const createWindowParams: ExtraWindowCreationParams = {
		name: `conversation-${conversationId}`,
		returnComponent: false,
		children: <SearchConversationPreviewPanelContainer conversationId={conversationId} />,
		title: subject,
		closeOnUnmount: false
	};
	createWindow(createWindowParams);
};

export const previewConversationOnSeparatedWindowAction = (
	conversationId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow']
): ConvActionReturnType => {
	const actDescriptor = ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW;
	return {
		id: actDescriptor.id,
		icon: 'ExternalLink',
		label: t('action.preview_on_separated_tab', 'Open in a new tab'),
		onClick: (): void => {
			previewConversationOnSeparatedWindow(conversationId, subject, createWindow);
		}
	};
};
