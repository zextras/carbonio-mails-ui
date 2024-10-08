/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo, useRef, useState } from 'react';

import { map, omit } from 'lodash';

type UseSelectionProps = {
	count: number;
	items?: Array<{ id: string }>;
	setCount: (value: number | ((prevState: number) => number)) => void;
};

type UseSelectionReturnType = {
	selected: Record<string, boolean>;
	isSelectModeOn: boolean;
	setIsSelectModeOn: (value: boolean | ((prev: boolean) => boolean)) => void;
	toggle: (id: string) => void;
	deselectAll: () => void;
	selectAll: () => void;
	isAllSelected: boolean;
	selectAllModeOff: () => void;
};

export const useSelection = ({
	setCount,
	count,
	items = []
}: UseSelectionProps): UseSelectionReturnType => {
	const selected = useRef<Record<string, boolean>>({});
	const [isSelectModeOn, setIsSelectModeOn] = useState(false);
	const isAllSelected = useMemo(() => count === items.length, [count, items.length]);

	const selectItem = useCallback(
		(id: string) => {
			if (selected.current[id]) {
				selected.current = omit(selected.current, [id]);
				setCount((prev: number) => prev - 1);
				if (count - 1 === 0) {
					setIsSelectModeOn(false);
				} else if (count === 0) {
					setIsSelectModeOn(true);
				}
			} else {
				selected.current = { ...selected.current, [id]: true };
				setCount((prev: number) => prev + 1);
				setIsSelectModeOn(true);
			}
		},
		[count, setCount]
	);

	const deselectAll = useCallback(() => {
		selected.current = {};
		setCount(0);
		setIsSelectModeOn(false);
	}, [setCount, setIsSelectModeOn]);

	const selectAll = useCallback(() => {
		map(items, (item) => {
			if (!selected.current[item.id]) {
				selectItem(item.id);
			}
		});
	}, [items, selectItem, selected]);

	const selectAllModeOff = useCallback(() => {
		selected.current = {};
		setCount(0);
		setTimeout(() => {
			setIsSelectModeOn(true);
		});
	}, [setCount]);

	return {
		selected: selected.current,
		toggle: selectItem,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff
	};
};
