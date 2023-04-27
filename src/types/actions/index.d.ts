/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TagActionItemType } from '../tags';
import type { Folder } from '../../carbonio-ui-commons/types/folder';

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
	onClick: (ev: KeyboardEvent | SyntheticEvent<HTMLElement, Event>) => void;
	items?: ItemType[];
	customComponent?: React.ReactElement;
};

export type ConvActionReturnType = {
	id: string;
	icon: string;
	label: string;
	disabled?: boolean;
	onClick: (ev: KeyboardEvent | SyntheticEvent<HTMLElement, Event>) => void;
	customComponent?: JSX.Element;
	items?: ItemType[];
};

export type ActionReturnType =
	| false
	| MessageActionReturnType
	| ConvActionReturnType
	| TagActionItemType;
