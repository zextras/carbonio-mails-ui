/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useState } from 'react';
import { cloneDeep, concat, isEmpty, map, omit } from 'lodash';

export const useFilterSelection = (firstList, setFetchFilters, modifyFunc, secondList) => {
	const [selected, setSelected] = useState({});
	const [isSelecting, setIsSelecting] = useState(false);
	const [list, setList] = useState(firstList);

	useEffect(() => {
		setIsSelecting(!isEmpty(selected));
	}, [selected]);

	useEffect(() => {
		setList(firstList);
	}, [firstList]);

	const unSelect = useCallback(() => {
		setSelected({});
	}, []);

	const selectItem = useCallback((id) => {
		setSelected({ [id]: true });
	}, []);

	const moveDown = useCallback(
		(index) => {
			const tmp = list.slice();
			if (index === tmp.length - 1) return;
			const index2 = index + 1;
			const itemBelow = cloneDeep(tmp[index2]);
			tmp[index + 1] = cloneDeep(tmp[index]);
			tmp[index] = itemBelow;
			setList(tmp);
			setSelected(tmp[index + 1].id);
			const toSend = concat(
				map(tmp, (t) => omit(t, 'id')),
				secondList
			);
			modifyFunc(toSend).then(() => {
				setFetchFilters(true);
			});
		},
		[list, secondList, modifyFunc, setFetchFilters]
	);
	const moveUp = useCallback(
		(index) => {
			const tmp = list.slice();
			const index2 = index - 1;
			const itemAbove = cloneDeep(tmp[index2]);
			tmp[index - 1] = cloneDeep(tmp[index]);
			tmp[index] = itemAbove;
			setList(tmp);
			setSelected(tmp[index - 1].id);

			const toSend = concat(
				map(tmp, (t) => omit(t, 'id')),
				secondList
			);

			modifyFunc(toSend).then(() => {
				setFetchFilters(true);
			});
		},
		[list, secondList, modifyFunc, setFetchFilters]
	);

	return { selected, isSelecting, toggle: selectItem, unSelect, moveDown, moveUp, list };
};
