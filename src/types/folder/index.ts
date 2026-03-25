/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { IncompleteMessage, MailMessage } from 'types/messages';

export type MessageListItemProps = {
	message: IncompleteMessage;
	selected: boolean;
	selecting: boolean;
	visible: boolean;
	isConvChildren: boolean;
	active?: boolean;
	isSearchModule?: boolean;
	isConversation?: boolean;
	currentFolderId?: string;
	handleReplaceHistory?: () => void;
	index: number;
	onSelect: (index: number, id: string, event: React.MouseEvent) => void;
};
export type MsgListDraggableItemType = {
	item: Partial<MailMessage> & Pick<MailMessage, 'id'>;
	folderId: string;
	children: React.ReactNode | React.ReactNode[];
	isMessageView: boolean;
	dragCheck: (e: React.DragEvent, id: string) => void;
	selectedIds: Array<string>;
};

export type CustomListItem = Partial<MailMessage> & { id: string; isSearchModule?: boolean };
