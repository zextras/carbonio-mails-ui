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
	isFromSearch?: boolean;
	textValues?: TextReadValuesProps;
};

export type MessageListItemProps = {
	item: IncompleteMessage & { isFromSearch?: boolean };
	folderId: string;
	selected: boolean;
	selecting: boolean;
	toggle?: () => void;
	draggedIds: Record<string, boolean>;
	setDraggedIds: (ids: Record<string, boolean>) => void;
	setIsDragging: (isDragging: boolean) => void;
	selectedItems: Record<string, boolean>;
	dragImageRef?: React.RefObject<HTMLElement>;
	visible: boolean;
	isConvChildren: boolean;
	active?: boolean;
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
	current?: boolean;
	onClick?: ContainerProps['onClick'];
	onDoubleClick?: ContainerProps['onDoubleClick'];
	messagesToRender?: Array<IncompleteMessage>;
	hoverTooltipLabel?: string;
} & (
	| { isConversation: true; item: Conversation }
	| { isConversation?: false; item: IncompleteMessage }
);

export type ItemAvatarType = {
	item: any;
	selected: boolean;
	selecting: boolean;
	toggle: (arg: string) => void;
	folderId: string;
	isSearch?: boolean;
};

export type CustomListItem = Partial<MailMessage> & { id: string; isFromSearch?: boolean };

export type ConversationMessagesListProps = {
	active: string;
	conversationStatus: string | undefined;
	messages: Array<IncompleteMessage>;
	folderId: string;
	length: number;
	isFromSearch?: boolean;
};
