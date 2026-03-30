/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ComponentType, SyntheticEvent } from 'react';

import { AccordionItemType, CloseModalFn, CreateModalFn } from '@zextras/carbonio-design-system';

export type TagActionsReturnType = {
	id: string;
	icon: string;
	label: string;
	onClick?: (arg: SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void;
	items?: Array<{
		customComponent: ComponentType;
		id: string;
		icon: string;
		label: string;
	}>;
};

export type ArgumentType = {
	closeModal?: CloseModalFn;
	createModal?: CreateModalFn;
	items?: TagActionsReturnType;
	tag?: ItemType;
};

export type Tag = {
	color?: number;
	id: string;
	name: string;
	rgb?: string;
	u?: number;
	n?: number;
};

export type Tags = Record<string, Tag>;

export type ReturnType = {
	id: string;
	icon: string;
	label: string;
	click?: (arg: SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void;
	items?: Array<{
		customComponent: ComponentType;
		id: string;
		icon: string;
		label: string;
	}>;
};

export type ItemType = {
	CustomComponent: ComponentType<any>;
	item: AccordionItemType;
	active: boolean;
	color: number;
	divider?: boolean;
	id: string;
	label: string;
	name: string;
	open: boolean;
	actions?: Array<unknown>;
};
