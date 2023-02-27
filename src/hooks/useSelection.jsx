/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { omit, isEmpty, map } from 'lodash';

export const useSelection = (currentFolderId, setCount, count, items = []) => {
	const [selected, setSelected] = useState({});
	const [folderId, setFolderId] = useState(currentFolderId);
	const [isSelectModeOn, setIsSelectModeOn] = useState(false);
	useEffect(() => {
		setIsSelectModeOn(!isEmpty(selected));
		if (currentFolderId !== folderId) {
			setSelected({});
			setFolderId(currentFolderId);
			setIsSelectModeOn(false);
			setCount(0);
		}
	}, [currentFolderId, folderId, selected, setCount]);

	const isAllSelected = useMemo(() => count === items.length, [count, items.length]);
	const selectItem = useCallback(
		(id) => {
			if (selected[id]) {
				setSelected((s) => omit(s, [id]));
				setCount((c) => c - 1);
			} else {
				setSelected((s) => ({ ...s, [id]: true }));
				setCount((c) => c + 1);
			}
		},
		[selected, setCount]
	);

	const deselectAll = useCallback(() => {
		setIsSelectModeOn(false);
		setSelected({});
		setCount(0);
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
