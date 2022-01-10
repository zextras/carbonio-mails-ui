/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export type Folder = {
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
	items: Folder[];
	level: number;
	to: string;
	color: string;
	rgb: string;
	rid?: string;
	isSharedFolder?: boolean;
	owner?: string;
	zid?: string;
	acl?: unknown;
	perm?: string;
	retentionPolicy?: unknown;
};

// eslint-disable-next-line no-shadow
export enum FolderActionsType {
	NEW = 'new',
	MOVE = 'move',
	DELETE = 'delete',
	EDIT = 'edit',
	EMPTY = 'empty',
	REMOVE_FROM_LIST = 'removeFromList',
	SHARES_INFO = 'sharesInfo',
	SHARE = 'share'
}
