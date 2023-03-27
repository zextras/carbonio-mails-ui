/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { map, omit } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { Conversation, IncompleteMessage } from '../types';

export type useSelectionProps = {
	currentFolderId: string;
	count: number;
	items?: Array<IncompleteMessage | Conversation>;
	setCount: (value: number | ((prevState: number) => number)) => void;
};

export type useSelectionReturnType = {
	selected: Record<string, boolean>;
	isSelectModeOn: boolean;
	toggle: (id: string) => void;
	deselectAll: () => void;
	selectAll: () => void;
	isAllSelected: boolean;
	selectAllModeOff: () => void;
	setIsSelectModeOn: (isSelectModeOn: boolean | ((prevState: boolean) => boolean)) => void;
};

export const useSelection = ({
	setCount,
	count,
	items = []
}: useSelectionProps): useSelectionReturnType => {
	const [selected, setSelected] = useState<Record<string, boolean>>({});
	const [isSelectModeOn, setIsSelectModeOn] = useState(false);
	const isAllSelected = useMemo(() => count === items.length, [count, items.length]);

	const selectItem = useCallback(
		(id) => {
			if (selected[id]) {
				setSelected((s) => omit(s, [id]));
				setCount((prev: number) => prev - 1);
				if (count - 1 === 0) {
					setIsSelectModeOn(false);
				} else if (count === 0) {
					setIsSelectModeOn(true);
				}
			} else {
				setSelected((s) => ({ ...s, [id]: true }));
				setCount((prev: number) => prev + 1);
				setIsSelectModeOn(true);
			}
		},
		[count, selected, setCount]
	);

	const deselectAll = useCallback(() => {
		setSelected({});
		setCount(0);
		setIsSelectModeOn(false);
	}, [setCount]);

	const selectAll = useCallback(() => {
		map(items, (conv) => {
			if (!selected[conv.id]) {
				selectItem(conv.id);
			}
		});
	}, [items, selectItem, selected]);

	const selectAllModeOff = useCallback(() => {
		setSelected({});
		setCount(0);
		setTimeout(() => {
			setIsSelectModeOn(true);
		});
	}, [setCount]);

	return {
		selected,
		toggle: selectItem,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff
	};
};
