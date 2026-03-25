/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useState } from 'react';

import { cloneDeep, concat, isEmpty, map, omit } from 'lodash';

import { Filter } from 'types/filters';
import { FiltersListType } from 'views/settings/filters/types';

export const useFilterSelection = (
	firstList: Array<Filter>,
	modifyFunc: (newFilters: Array<Filter>) => Promise<void>,
	secondList: Array<Filter>
): FiltersListType => {
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

	const selectItem = useCallback((name: string) => {
		setSelected({ [name]: true });
	}, []);

	const moveDown = useCallback(
		(index: number) => {
			const tmp = list.slice();
			if (index === tmp.length - 1) return;
			const index2 = index + 1;
			const itemBelow = cloneDeep(tmp[index2]);
			tmp[index + 1] = cloneDeep(tmp[index]);
			tmp[index] = itemBelow;
			setList(tmp);
			setSelected(tmp[index + 1].name);
			const toSend = concat(
				map(tmp, (t) => omit(t, 'id')),
				secondList
			);
			modifyFunc(toSend);
		},
		[list, secondList, modifyFunc]
	);
	const moveUp = useCallback(
		(index: number) => {
			const tmp = list.slice();
			const index2 = index - 1;
			const itemAbove = cloneDeep(tmp[index2]);
			tmp[index - 1] = cloneDeep(tmp[index]);
			tmp[index] = itemAbove;
			setList(tmp);
			setSelected(tmp[index - 1].name);

			const toSend = concat(
				map(tmp, (t) => omit(t, 'id')),
				secondList
			);

			modifyFunc(toSend);
		},
		[list, secondList, modifyFunc]
	);

	return { selected, isSelecting, toggle: selectItem, unSelect, moveDown, moveUp, list };
};
