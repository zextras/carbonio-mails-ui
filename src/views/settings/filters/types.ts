/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Filter, FilterAction } from 'types/filters';

export type OnFilterActionChange = (filterActionValue: FilterAction) => void;

export type ActionComponentProps<T extends FilterAction> = {
	value: T;
	onChange: OnFilterActionChange;
};
export type FiltersListType = {
	isSelecting: boolean;
	list: Array<Filter>;
	moveDown: (arg: number) => void;
	moveUp: (arg: number) => void;
	selected: Record<string, boolean>;
	toggle: (arg: string) => void;
	unSelect: () => void;
};
