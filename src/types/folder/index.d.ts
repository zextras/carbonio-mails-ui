/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactNode } from 'react';

import { ContainerProps } from '@zextras/carbonio-design-system';

import { UIActionDescriptor } from 'types/actions/index.d';
import { Conversation } from 'types/conversations/index.d';
import { IncompleteMessage, MailMessage } from 'types/messages/index.d';

export type GrantType = { gt: string; perm: string; zid: string; d?: string };

export type MessageListItemProps = {
	message: IncompleteMessage;
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
	onClick?: MouseEventHandler<HTMLDivElement>;
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
