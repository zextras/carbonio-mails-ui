import { Folder } from '@zextras/carbonio-shell-ui';
import { ReactElement } from 'react';

/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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

export type AccordionComponent = Folder & {
	CustomComponent: ReactElement;
};
