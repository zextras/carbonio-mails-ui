/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useState } from 'react';
import { omit, isEmpty } from 'lodash';

export const useSelection = (currentFolderId, setCount) => {
	const [selected, setSelected] = useState({});
	const [isSelecting, setIsSelecting] = useState(false);
	const [folderId, setFolderId] = useState(currentFolderId);

	useEffect(() => {
		setIsSelecting(!isEmpty(selected));
		if (currentFolderId !== folderId) {
			setSelected({});
			setFolderId(currentFolderId);
			setIsSelecting(false);
			setCount(0);
		}
	}, [currentFolderId, folderId, selected, setCount]);

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
		setSelected({});
		setCount(0);
	}, [setCount]);

	return { selected, isSelecting, toggle: selectItem, deselectAll };
};
