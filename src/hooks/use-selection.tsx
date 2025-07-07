/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useRef, useState } from 'react';

import { map, omit } from 'lodash';

type UseSelectionProps = {
	items?: Array<string>;
};

type UseSelectionReturnType = {
	selected: Record<string, boolean>;
	isSelectModeOn: boolean;
	setIsSelectModeOn: (value: boolean | ((prev: boolean) => boolean)) => void;
	toggle: (id: string) => void;
	deselectAll: () => void;
	selectAll: () => void;
	selectAllModeOff: () => void;
};

export const useMultipleSelection = ({ items = [] }: UseSelectionProps): UseSelectionReturnType => {
	const selected = useRef<Record<string, boolean>>({});
	const [isSelectModeOn, setIsSelectModeOn] = useState(false);

	const toggleItemSelection = useCallback((id: string) => {
		if (selected.current[id]) {
			selected.current = omit(selected.current, [id]);
			if (Object.keys(selected.current).length === 1) {
				setIsSelectModeOn(false);
			} else if (Object.keys(selected.current).length === 0) {
				setIsSelectModeOn(true);
			}
		} else {
			selected.current = { ...selected.current, [id]: true };
			setIsSelectModeOn(true);
		}
	}, []);

	const deselectAll = useCallback(() => {
		selected.current = {};
		setIsSelectModeOn(false);
	}, [setIsSelectModeOn]);

	const selectAll = useCallback(() => {
		map(items, (id) => {
			if (!selected.current[id]) {
				toggleItemSelection(id);
			}
		});
	}, [items, toggleItemSelection, selected]);

	const selectAllModeOff = useCallback(() => {
		selected.current = {};
		setTimeout(() => {
			setIsSelectModeOn(true);
		});
	}, []);

	return {
		selected: selected.current,
		toggle: toggleItemSelection,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		selectAllModeOff
	};
};
