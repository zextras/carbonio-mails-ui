/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppContext } from '@zextras/carbonio-shell-ui';

import { AppContext } from 'app-utils/app-context-initializer';

type UseMultipleSelectionProps = {
	allAvailableItems?: Array<string>;
	selectedItems?: Set<string>;
	setSelectedItems?: React.Dispatch<React.SetStateAction<Set<string>>>;
	anchorId?: string | null;
	setAnchorId?: React.Dispatch<React.SetStateAction<string | null>>;
	resetAnchorKey?: string;
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
	anchorId = null,
	setAnchorId,
	resetAnchorKey
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

	// The anchor only means something inside the list it was set in: dropping it on a
	// folder or sorting change keeps the next shift+click from extending a range the
	// user can no longer see. Only a change of key resets, never the first render, so a
	// remounting list does not lose an anchor it was given.
	const previousResetAnchorKey = useRef(resetAnchorKey);
	useEffect(() => {
		if (previousResetAnchorKey.current === resetAnchorKey) {
			return;
		}
		previousResetAnchorKey.current = resetAnchorKey;
		setAnchorId?.(null);
	}, [resetAnchorKey, setAnchorId]);

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
				// The clicked item becomes the anchor of the next range. Emptying the
				// selection exits selection mode, and the anchor goes with it.
				setAnchorId?.(newSize > 0 ? id : null);
				setIsSelectModeOn(!itemWasAlreadySelected || newSize > 0);

				return newSet;
			});
		},
		[setAnchorId, setSelectedItems]
	);

	const deselectAll = useCallback(() => {
		setSelectedItems?.(new Set());
		setAnchorId?.(null);
		setIsSelectModeOn(false);
	}, [setAnchorId, setSelectedItems]);

	const selectAll = useCallback(() => {
		setIsSelectModeOn(true);
		setSelectedItems?.(new Set(allAvailableItems));
		setAnchorId?.(null);
	}, [allAvailableItems, setAnchorId, setSelectedItems]);

	const selectAllModeOff = useCallback(() => {
		setIsSelectModeOn(false);
		setSelectedItems?.(new Set());
		setAnchorId?.(null);
	}, [setAnchorId, setSelectedItems]);

	const selectRange = (index: number, id: string, event: React.MouseEvent): void => {
		// An anchor that is no longer in the list (deleted, moved, filtered out by a new
		// query) resolves to -1 and degrades to a plain single toggle.
		const anchorIndex = anchorId === null ? -1 : allAvailableItems.indexOf(anchorId);
		const canExtendRange = isSelectModeOn && event.shiftKey && anchorIndex !== -1;

		if (!canExtendRange) {
			// Plain click, ctrl/cmd+click, and any click with no usable anchor all behave
			// the same here: this is a checkbox list, so a single click already toggles
			// one item without clearing the rest.
			toggleItemSelection(id);
			return;
		}

		// The range only ever adds: newSelection = union(currentSelection, [min..max]).
		// It fills the gaps and never toggles an already selected item off, so the result
		// is the same whether the shift+click goes forward or backward from the anchor.
		const start = Math.min(anchorIndex, index);
		const end = Math.max(anchorIndex, index);
		const idsToSelect = allAvailableItems.slice(start, end + 1);
		setSelectedItems?.((prev) => {
			const newSet = new Set(prev);
			idsToSelect.forEach((itemId) => newSet.add(itemId));
			return newSet;
		});
		// The anchor stays put, so repeated shift+clicks keep growing the same range.
		setIsSelectModeOn(true);
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
