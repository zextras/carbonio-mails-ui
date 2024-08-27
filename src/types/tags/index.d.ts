/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ComponentType } from 'react';

import {
	CloseModalFn,
	CreateModalFn,
	ItemType as AccordionItemType
} from '@zextras/carbonio-design-system';
import { Tag } from '@zextras/carbonio-shell-ui';

export type TagActionItemType = {
	id: string;
	items: ItemType[];
	customComponent: ReactElement;
	onClick?: (ev: KeyboardEvent | SyntheticEvent<HTMLElement, Event>) => void;
};

export type TagActionsReturnType = {
	id: string;
	icon: string;
	label: string;
	onClick?: (arg: React.SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void;
	items?: Array<{
		customComponent: ComponentType;
		id: string;
		icon: string;
		label: string;
	}>;
};

export type TagsFromStoreType = Record<string, Tag>;

export type ArgumentType = {
	closeModal?: CloseModalFn;
	createModal?: CreateModalFn;
	items?: TagActionsReturnType;
	tag?: ItemType;
};

export interface ItemType extends AccordionItemType<T> {
	item: T;
	CustomComponent?: ComponentType<T>;
	active: boolean;
	color: number;
	id: string;
	label: string;
	name: string;
	open: boolean;
	actions?: Array<unknown>;
}
