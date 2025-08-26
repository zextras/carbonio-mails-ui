/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useState } from 'react';

import { useAppContext } from '@zextras/carbonio-shell-ui';

import { AppContext } from 'app-utils/app-context-initializer';

type UseMultipleSelectionProps = {
	allAvailableItems?: Array<string>;
	selectedItems?: Set<string>;
	setSelectedItems?: React.Dispatch<React.SetStateAction<Set<string>>>;
	lastSelectedIndex?: number | null;
	setLastSelectedIndex?: React.Dispatch<React.SetStateAction<number | null>>;
	isSearchModule?: boolean;
};

type UseMultypleSelectionReturnType = {
	isSelectModeOn: boolean;
	setIsSelectModeOn: (value: boolean | ((prev: boolean) => boolean)) => void;
	deselectAll: () => void;
	selectAll: () => void;
	isAllSelected: boolean;
	selectAllModeOff: () => void;
	selectRange: (index: number, id: string, event: React.MouseEvent) => void;
};

export const useMultipleSelection = ({
	allAvailableItems = [],
	selectedItems = new Set<string>(),
	setSelectedItems,
	lastSelectedIndex = null,
	setLastSelectedIndex
}: UseMultipleSelectionProps): UseMultypleSelectionReturnType => {
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
		(id: string, index: number) => {
			setSelectedItems?.((prev) => {
				const newSet = new Set(prev);
				const itemWasAlreadySelected = newSet.has(id);

				if (itemWasAlreadySelected) {
					newSet.delete(id);
				} else {
					newSet.add(id);
				}
				// Update lastSelectedIndex when provided
				setLastSelectedIndex?.(index);
				const newSize = newSet.size;
				setIsSelectModeOn(!itemWasAlreadySelected || newSize > 0);

				return newSet;
			});
		},
		[setLastSelectedIndex, setSelectedItems]
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

	const selectRange = (index: number, id: string, event: React.MouseEvent): void => {
		if (!isSelectModeOn) {
			toggleItemSelection(id, index);
			return;
		}

		if (event.shiftKey && lastSelectedIndex !== null) {
			const start = Math.min(lastSelectedIndex, index);
			const end = Math.max(lastSelectedIndex, index);
			const idsToSelect = allAvailableItems.slice(start, end + 1);
			setSelectedItems?.((prev) => {
				const newSet = new Set(prev);
				idsToSelect.forEach((itemId) => newSet.add(itemId));
				return newSet;
			});
			setIsSelectModeOn(true);
		} else {
			toggleItemSelection(id, index);
			setLastSelectedIndex?.(index);
		}
	};

	return {
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff,
		selectRange
	};
};
