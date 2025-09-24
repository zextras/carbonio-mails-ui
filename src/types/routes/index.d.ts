/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type EmlRouteParams = {
	folderId: string;
	messageId: string;
	part: string;
};

export type DetailPanelConversationRouteParams = {
	folderId: string;
	conversationId: string;
	messageId?: never;
};

export type DetailPanelMessageRouteParams = {
	folderId: string;
	messageId: string;
	conversationId?: never;
};

export type DetailPanelRoutesParams =
	| DetailPanelConversationRouteParams
	| DetailPanelMessageRouteParams;

export type FolderPanelRouteParams = {
	folderId: string;
	type?: 'message' | 'conversation';
	itemId?: string;
};

export type SidebarRouteParams = {
	folderId: string;
	type?: 'message' | 'conversation';
	itemId?: string;
};

export type SearchListPanelRouteParams = {
	type?: 'message' | 'conversation';
	itemId?: string;
};

export type SearchDetailPanelConversationRouteParams = {
	conversationId: string;
	messageId?: never;
};

export type SearchDetailPanelMessagePanelRouteParams = {
	messageId: string;
	conversationId?: never;
};

export type SearchDetailPanelRouteParams =
	| SearchDetailPanelConversationRouteParams
	| SearchDetailPanelMessagePanelRouteParams;

export type SearchRoutesParams = SearchDetailPanelRouteParams | SearchListPanelRouteParams;
