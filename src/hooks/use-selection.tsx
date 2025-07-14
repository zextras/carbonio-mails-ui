/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAppContext } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { AppContext } from 'types';

type UseSelectionProps = {
	allAvailableItems?: Array<string>;
	selectedItems: Set<string>;
	setSelectedItems: React.Dispatch<React.SetStateAction<Set<string>>>;
	isSearchModule?: boolean;
};

type UseSelectionReturnType = {
	isSelectModeOn: boolean;
	setIsSelectModeOn: (value: boolean | ((prev: boolean) => boolean)) => void;
	toggle: (id: string) => void;
	deselectAll: () => void;
	selectAll: () => void;
	isAllSelected: boolean;
	selectAllModeOff: () => void;
};

export const useSelection = ({
	allAvailableItems = [],
	selectedItems = new Set<string>(),
	setSelectedItems
}: UseSelectionProps): UseSelectionReturnType => {
	const { setCount } = useAppContext<AppContext>();
	const [isSelectModeOn, setIsSelectModeOn] = useState(false);
	const isAllSelected = useMemo(
		() => selectedItems.size === allAvailableItems.length,
		[selectedItems.size, allAvailableItems.length]
	);

	useEffect(() => {
		setCount?.(selectedItems.size);
	}, [selectedItems, setCount]);

	const selectItem = useCallback(
		(id: string) => {
			if (selectedItems.has(id)) {
				setSelectedItems((prev) => {
					const newSet = new Set(prev);
					newSet.delete(id);
					return newSet;
				});

				if (selectedItems.size === 1) {
					setIsSelectModeOn(false);
				} else if (selectedItems.size === 0) {
					setIsSelectModeOn(true);
				}
			} else {
				setSelectedItems((prev) => {
					const newSet = new Set(prev);
					newSet.add(id);
					return newSet;
				});
				setIsSelectModeOn(true);
			}
		},
		[selectedItems, setSelectedItems]
	);

	const deselectAll = useCallback(() => {
		setSelectedItems(new Set());
		setCount?.(0);
		setIsSelectModeOn(false);
	}, [setCount, setSelectedItems]);

	const selectAll = useCallback(() => {
		map(allAvailableItems, (id) => {
			if (!selectedItems.has(id)) {
				selectItem(id);
			}
		});
	}, [allAvailableItems, selectItem, selectedItems]);

	const selectAllModeOff = useCallback(() => {
		setSelectedItems(new Set());
		setCount?.(0);
		setIsSelectModeOn(true);
	}, [setCount, setSelectedItems]);

	return {
		toggle: selectItem,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff
	};
};
