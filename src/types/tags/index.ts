/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ComponentType, ReactElement, SyntheticEvent } from 'react';

import { AccordionItemType, CloseModalFn, CreateModalFn } from '@zextras/carbonio-design-system';
import { WorkerMessage } from '@zextras/carbonio-ui-commons';

export type TagActionItemType = {
	id: string;
	items: AccordionItemType[];
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

export type TagState = {
	tags: Tags;
};

export type ReturnType = {
	id: string;
	icon: string;
	label: string;
	click?: (arg: React.SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void;
	items?: Array<{
		customComponent: ComponentType;
		id: string;
		icon: string;
		label: string;
	}>;
};

export type TagsFromStoreType = Record<string, Tag>;

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

export type TagsAccordionItems = {
	items: ItemType[];
	id: string;
	label: string;
	divider?: true;
	active: false;
	open: boolean;
	onClick: AccordionItemType['onClick'];
	CustomComponent: ComponentType<any>;
};

export type TagMessage = WorkerMessage<{ state: Tags }>;
