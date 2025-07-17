/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useState } from 'react';

import { useAppContext } from '@zextras/carbonio-shell-ui';

import { AppContext } from 'app-utils/app-context-initializer';

type UseSelectionProps = {
	allAvailableItems?: Array<string>;
	selectedItems?: Set<string>;
	setSelectedItems?: React.Dispatch<React.SetStateAction<Set<string>>>;
	isSearchModule?: boolean;
};

type UseMultypleSelectionReturnType = {
	isSelectModeOn: boolean;
	setIsSelectModeOn: (value: boolean | ((prev: boolean) => boolean)) => void;
	toggleItemSelection: (id: string) => void;
	deselectAll: () => void;
	selectAll: () => void;
	isAllSelected: boolean;
	selectAllModeOff: () => void;
};

export const useMultipleSelection = ({
	allAvailableItems = [],
	selectedItems = new Set<string>(),
	setSelectedItems
}: UseSelectionProps): UseMultypleSelectionReturnType => {
	const { setMultipleSelectionCount } = useAppContext<AppContext>();
	const [isSelectModeOn, setIsSelectModeOn] = useState(false);

	useEffect(() => {
		setMultipleSelectionCount?.(selectedItems.size);
	}, [selectedItems.size, setMultipleSelectionCount]);

	const [isAllSelected, setIsAllSelected] = useState(false);
	useEffect(() => {
		setIsAllSelected(selectedItems.size === allAvailableItems.length);
	}, [selectedItems, allAvailableItems]);

	const toggleItemSelection = useCallback(
		(id: string) => {
			setSelectedItems?.((prev) => {
				const newSet = new Set(prev);
				const itemWasAlreadySelected = newSet.has(id);

				if (itemWasAlreadySelected) {
					newSet.delete(id);
				} else {
					newSet.add(id);
				}

				const newSize = newSet.size;
				setIsSelectModeOn(!itemWasAlreadySelected || newSize > 0);

				return newSet;
			});
		},
		[setSelectedItems]
	);

	const deselectAll = useCallback(() => {
		setSelectedItems?.(new Set());
		setIsSelectModeOn(false);
	}, [setSelectedItems]);

	const selectAll = useCallback(() => {
		setIsSelectModeOn(true);
		setSelectedItems?.(new Set(allAvailableItems));
	}, [allAvailableItems, setSelectedItems]);

	const selectAllModeOff = useCallback(() => {
		setIsSelectModeOn(false);
		setSelectedItems?.(new Set());
	}, [setSelectedItems]);

	return {
		toggleItemSelection,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff
	};
};
