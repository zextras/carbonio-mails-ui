/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContainerProps } from '@zextras/carbonio-design-system';
import React, { ReactNode } from 'react';
import { Conversation } from '../conversations';
import { IncompleteMessage, MailMessage } from '../messages';
import { TextReadValuesProps } from '../utils';

export type FolderType = {
	id: string;
	uuid: string;
	name: string;
	path: string | undefined;
	parent: string;
	parentUuid: string;
	unreadCount: number;
	size: number;
	itemsCount: number;
	synced: boolean;
	absParent: string;
	items: FolderType[];
	level: number;
	to: string;
	color: string;
	rgb: string;
	rid?: string;
	isSharedFolder?: boolean;
	isShared?: boolean;
	owner?: string;
	zid?: string;
	acl?: unknown;
	perm?: string;
	retentionPolicy?: unknown;
	children?: Array<unknown>;
};

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
	conversationStatus: string | undefined;
	messages: Array<IncompleteMessage>;
	folderId: string;
	length: number;
	isSearchModule?: boolean;
	dragImageRef?: React.RefObject<HTMLDivElement>;
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
