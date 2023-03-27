/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TagActionItemType } from '../tags';

export type ActionProps = {
	folder: Folder;
	grant: Grant;
	setActiveModal: (arg: string) => void;
	onMouseLeave: () => void;
	onMouseEnter: () => void;
};

export type MessageActionReturnType = {
	id: string;
	icon: string;
	label: string;
	onClick: (ev?: MouseEvent) => void;
	items?: ItemType[];
	customComponent?: React.ReactElement;
};

export type ConvActionReturnType = {
	id: string;
	icon: string;
	label: string;
	disabled?: boolean;
	onClick: (ev: MouseEvent) => void;
	customComponent?: JSX.Element;
};

export type ActionReturnType =
	| false
	| MessageActionReturnType
	| ConvActionReturnType
	| TagActionItemType;
