/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useState } from 'react';

import { map } from 'lodash';

type UseSelectionProps = {
	items?: Array<string>;
};

type UseSelectionReturnType = {
	selectedIds: Set<string>;
	isSelectModeOn: boolean;
	setIsSelectModeOn: (value: boolean | ((prev: boolean) => boolean)) => void;
	toggle: (id: string) => void;
	deselectAll: () => void;
	selectAll: () => void;
	selectAllModeOff: () => void;
};

export const useMultipleSelection = ({ items = [] }: UseSelectionProps): UseSelectionReturnType => {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isSelectModeOn, setIsSelectModeOn] = useState(false);

	const toggleItemSelection = useCallback(
		(id: string) => {
			if (selectedIds.has(id)) {
				setSelectedIds((prev) => {
					prev.delete(id);
					return new Set(prev);
				});
				if (selectedIds.size === 1) {
					setIsSelectModeOn(false);
				} else if (selectedIds.size === 0) {
					setIsSelectModeOn(true);
				}
			} else {
				setSelectedIds((prev) => {
					prev.add(id);
					return new Set(prev);
				});
				setIsSelectModeOn(true);
			}
		},
		[selectedIds]
	);

	const deselectAll = useCallback(() => {
		setSelectedIds(new Set());
		setIsSelectModeOn(false);
	}, [setIsSelectModeOn]);

	const selectAll = useCallback(() => {
		map(items, (id) => {
			if (!selectedIds.has(id)) {
				toggleItemSelection(id);
			}
		});
	}, [items, selectedIds, toggleItemSelection]);

	const selectAllModeOff = useCallback(() => {
		setSelectedIds(new Set());
		setIsSelectModeOn(true);
	}, []);

	return {
		selectedIds,
		toggle: toggleItemSelection,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		selectAllModeOff
	};
};
