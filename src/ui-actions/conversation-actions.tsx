/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { replaceHistory, t } from '@zextras/carbonio-shell-ui';

import { useInSearchModule } from './utils';
import { ConversationActionsDescriptors } from '../constants';
import { convAction } from '../store/actions';
import { AppDispatch } from '../store/redux';
import type {
	ConvActionReturnType,
	ExtraWindowCreationParams,
	ExtraWindowsContextType,
	MailMessage
} from '../types';
import { ConversationPreviewPanelContainer } from '../views/app/detail-panel/conversation-preview-panel-container';

type ConvActionIdsType = Array<string>;
type ConvActionValueType = string | boolean;
type DeselectAllType = () => void;
type CloseEditorType = () => void;
export type ConvActionPropType = {
	ids: ConvActionIdsType;
	id: string | ConvActionIdsType;
	value: ConvActionValueType;
	dispatch: AppDispatch;
	folderId: string;
	shouldReplaceHistory: boolean;
	deselectAll?: DeselectAllType;
	conversationId: string;
	closeEditor: CloseEditorType;
	isRestore: boolean;
	message: MailMessage;
	disabled: boolean;
};

export const previewConversationOnSeparatedWindow = (
	conversationId: string,
	folderId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow']
): void => {
	if (!createWindow) {
		return;
	}

	const createWindowParams: ExtraWindowCreationParams = {
		name: `conversation-${conversationId}`,
		returnComponent: false,
		children: (
			<ConversationPreviewPanelContainer conversationId={conversationId} folderId={folderId} />
		),
		title: subject,
		closeOnUnmount: false
	};
	createWindow(createWindowParams);
};

export const previewConversationOnSeparatedWindowAction = (
	conversationId: string,
	folderId: string,
	subject: string,
	createWindow: ExtraWindowsContextType['createWindow']
): ConvActionReturnType => {
	const actDescriptor = ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW;
	return {
		id: actDescriptor.id,
		icon: 'ExternalLink',
		label: t('action.preview_on_separated_tab', 'Open in a new tab'),
		onClick: (): void => {
			previewConversationOnSeparatedWindow(conversationId, folderId, subject, createWindow);
		}
	};
};

type SetConversationReadParameters = {
	ids: ConvActionIdsType;
	dispatch: AppDispatch;
	value: ConvActionValueType;
	deselectAll?: DeselectAllType;
	onFulFilled?: () => void;
};

export function setConversationsRead({
	ids,
	value,
	dispatch,
	deselectAll,
	onFulFilled
}: SetConversationReadParameters): ConvActionReturnType {
	const actDescriptor = value
		? ConversationActionsDescriptors.MARK_AS_UNREAD.id
		: ConversationActionsDescriptors.MARK_AS_READ.id;
	return {
		id: actDescriptor,
		icon: value ? 'EmailOutline' : 'EmailReadOutline',
		label: value
			? t('action.mark_as_unread', 'Mark as unread')
			: t('action.mark_as_read', 'Mark as read'),
		onClick: (): void => {
			dispatch(
				convAction({
					operation: `${value ? '!' : ''}read`,
					ids
				})
			).then((res) => {
				deselectAll && deselectAll();
				if (res.type.includes('fulfilled')) {
					onFulFilled?.();
				}
			});
		}
	};
}

export function useConversationsRead(): ({
	ids,
	value,
	dispatch,
	folderId,
	shouldReplaceHistory,
	deselectAll
}: Pick<
	ConvActionPropType,
	'ids' | 'dispatch' | 'value' | 'folderId' | 'shouldReplaceHistory' | 'deselectAll'
>) => ConvActionReturnType {
	const inSearchModule = useInSearchModule();
	return ({
		ids,
		value,
		dispatch,
		folderId,
		shouldReplaceHistory,
		deselectAll
	}: Pick<
		ConvActionPropType,
		'ids' | 'dispatch' | 'value' | 'folderId' | 'shouldReplaceHistory' | 'deselectAll'
	>): ConvActionReturnType => {
		const conditionalReplaceHistory = (): void => {
			if (shouldReplaceHistory) {
				inSearchModule ? replaceHistory(`/`) : replaceHistory(`/folder/${folderId}`);
			}
		};
		return setConversationsRead({
			ids,
			value,
			dispatch,
			deselectAll,
			onFulFilled: () => conditionalReplaceHistory()
		});
	};
}
