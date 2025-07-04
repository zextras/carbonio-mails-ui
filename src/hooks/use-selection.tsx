/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo, useState } from 'react';

import { map, omit } from 'lodash';

type UseSelectionProps = {
	count: number;
	items?: Array<string>;
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
	const [selected, setSelected] = useState<Record<string, boolean>>({});
	const [isSelectModeOn, setIsSelectModeOn] = useState(false);
	const isAllSelected = useMemo(() => count === items.length, [count, items.length]);

	const selectItem = useCallback(
		(id: string) => {
			setSelected((prevSelected) => {
				let selectedItems: Record<string, boolean> = {};
				if (prevSelected[id]) {
					const newSelected = omit(prevSelected, [id]);
					setCount?.((prev: number) => prev - 1);
					if (count - 1 === 0) {
						setIsSelectModeOn(false);
					}
					selectedItems = { ...newSelected };
				} else {
					const newSelected = { ...prevSelected, [id]: true };
					setCount?.((prev: number) => prev + 1);
					setIsSelectModeOn(true);
					selectedItems = { ...newSelected };
				}
				return selectedItems;
			});
		},
		[count, setCount]
	);

	const deselectAll = useCallback(() => {
		setSelected({});
		setCount?.(0);
		setIsSelectModeOn(false);
	}, [setCount]);

	const selectAll = useCallback(() => {
		map(items, (id) => {
			if (!selected[id]) {
				selectItem(id);
			}
		});
	}, [items, selectItem, selected]);

	const selectAllModeOff = useCallback(() => {
		setSelected({});
		setCount?.(0);
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
