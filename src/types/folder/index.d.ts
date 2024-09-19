/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactNode } from 'react';

import { ContainerProps } from '@zextras/carbonio-design-system';

import { UIActionDescriptor } from '../actions';
import { Conversation } from '../conversations';
import { IncompleteMessage, MailMessage } from '../messages';
import { SearchRequestStatus } from '../state';
import { TextReadValuesProps } from '../utils';

export type GrantType = { gt: string; perm: string; zid: string; d?: string };

export type SenderNameProps = {
	item: Conversation | IncompleteMessage;
	isSearchModule?: boolean;
	textValues?: TextReadValuesProps;
	folderId?: string;
};

export type MessageListItemProps = {
	item: IncompleteMessage & { isSearchModule?: boolean };
	selected: boolean;
	selecting: boolean;
	toggle: (id: string) => void;
	visible: boolean;
	isConvChildren: boolean;
	active?: boolean;
	isSearchModule?: boolean;
	isConversation?: boolean;
	deselectAll: () => void;
	currentFolderId?: string;
	handleReplaceHistory?: () => void;
};

export type TextReadValuesType = {
	color: 'text' | 'primary';
	weight: 'medium' | 'light' | 'regular' | 'bold';
	badge: 'read' | 'unread';
};

export type MsgListDraggableItemType = {
	item: Partial<MailMessage> & Pick<MailMessage, 'id'>;
	folderId: string;
	children: React.ReactNode | React.ReactNode[];
	isMessageView: boolean;
	dragCheck: (e: React.DragEvent, id: string) => void;
	selectedIds: Array<string>;
};
export type ListItemActionWrapperProps = {
	children?: ReactNode;
	onClick?: ContainerProps['onClick'];
	onDoubleClick?: ContainerProps['onDoubleClick'];
	messagesToRender?: Array<IncompleteMessage>;
	hoverTooltipLabel?: string;
	active?: boolean;
	item: Conversation | MailMessage;
	deselectAll: () => void;
	hoverActions: UIActionDescriptor[];
	dropdownActions: UIActionDescriptor[];
};

export type ItemAvatarType = {
	item: any;
	selected: boolean;
	selecting: boolean;
	toggle: (arg: string) => void;
	folderId: string;
};

export type CustomListItem = Partial<MailMessage> & { id: string; isSearchModule?: boolean };

export type ConversationMessagesListProps = {
	active: string;
	conversationStatus: SearchRequestStatus | undefined;
	messages: Array<IncompleteMessage>;
	folderId: string;
	length: number;
	isSearchModule?: boolean;
	dragImageRef?: React.RefObject<HTMLDivElement>;
	setDraggedIds?: (ids: Record<string, boolean>) => void;
};

export type ConversationListItemProps = {
	item: Conversation;
	selected: boolean;
	selecting: boolean;
	toggle: (id: string) => void;
	visible?: boolean;
	isConvChildren: boolean;
	active?: boolean;
	isSearchModule?: boolean;
	activeItemId: string;
	dragImageRef?: React.RefObject<HTMLInputElement>;
	setDraggedIds?: (ids: Record<string, boolean>) => void;
	draggedIds?: Record<string, boolean> | undefined;
	selectedItems?: Record<string, boolean>;
	deselectAll: () => void;
	folderId?: string;
};
