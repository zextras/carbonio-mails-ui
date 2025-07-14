/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAppContext } from '@zextras/carbonio-shell-ui';
import { map, omit } from 'lodash';

import { AppContext } from 'types';

type UseSelectionProps = {
	allAvailableItems?: Array<string>;
	selectedItems: Record<string, boolean>;
	setSelectedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
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
	selectedItems,
	setSelectedItems
}: UseSelectionProps): UseSelectionReturnType => {
	const { setCount } = useAppContext<AppContext>();
	const selectedItemsNumber = Object.keys(selectedItems).length;
	const [isSelectModeOn, setIsSelectModeOn] = useState(false);
	const isAllSelected = useMemo(
		() => selectedItemsNumber === allAvailableItems.length,
		[selectedItemsNumber, allAvailableItems.length]
	);

	useEffect(() => {
		setCount?.(Object.keys(selectedItems).length);
	}, [selectedItems, setCount]);

	const selectItem = useCallback(
		(id: string) => {
			if (selectedItems[id]) {
				setSelectedItems((prev) => omit(prev, [id]));

				if (selectedItemsNumber === 1) {
					setIsSelectModeOn(false);
				} else if (selectedItemsNumber === 0) {
					setIsSelectModeOn(true);
				}
			} else {
				setSelectedItems((prev) => ({ ...prev, [id]: true }));
				setIsSelectModeOn(true);
			}
		},
		[selectedItems, selectedItemsNumber, setSelectedItems]
	);

	const deselectAll = useCallback(() => {
		setSelectedItems({});
		setCount?.(0);
		setIsSelectModeOn(false);
	}, [setCount, setSelectedItems]);

	const selectAll = useCallback(() => {
		map(allAvailableItems, (id) => {
			if (!selectedItems[id]) {
				selectItem(id);
			}
		});
	}, [allAvailableItems, selectItem, selectedItems]);

	const selectAllModeOff = useCallback(() => {
		setSelectedItems({});
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
