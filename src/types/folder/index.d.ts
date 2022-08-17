/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
};

export type GrantType = { gt: string; perm: string; zid: string; d?: string };

export type SenderNameProps = {
	item: Conversation | IncompleteMessage;
	isFromSearch?: boolean;
	textValues?: TextReadValuesProps;
};

export type MessageListItemType = {
	item: any;
	folderId: string;
	active: boolean;
	selected: boolean;
	selecting: boolean;
	toggle: () => null;
	draggedIds: Array<string> | undefined;
	setDraggedIds: (arg: any) => void;
	setIsDragging: (arg: boolean) => void;
	selectedItems: any;
	dragImageRef: any;
	visible: boolean;
	isConvChildren: boolean;
};

export type TextReadValuesType = {
	color: 'text' | 'primary';
	weight: 'medium' | 'light' | 'regular' | 'bold';
	badge: 'read' | 'unread';
};

export type MsgListDraggableItemType = {
	item: MailMessage;
	folderId: string;
	children: any;
	isMessageView: boolean;
	dragCheck: (e: any, id: any) => void;
	selectedIds: Array<string>;
};
export type ListItemActionWrapperProps = {
	children?: ReactNode;
	current?: boolean;
	onClick?: ContainerProps['onClick'];
	onDoubleClick?: ContainerProps['onDoubleClick'];
	item: Conversation | IncompleteMessage;
	isConversation?: boolean;
	messagesToRender?: Array<Partial<MailMessage>>;
	hoverTooltipLabel?: string;
};

export type ItemAvatarType = {
	item: any;
	selected: boolean;
	selecting: boolean;
	toggle: (arg: string) => void;
	folderId: string;
	isSearch: boolean;
};

export type CustomListItem = Partial<MailMessage> & { id: string; isFromSearch?: boolean };

export type ConversationMessagesListProps = {
	active: string;
	conversationStatus: string | undefined;
	messages: Array<Partial<MailMessage>>;
	folderId: string;
	length: number;
	isFromSearch?: boolean;
};
