/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { List, ListItem } from '@zextras/carbonio-design-system';
import { map } from 'lodash';

import { Filter } from 'types/filters';
import { FilterItem } from 'views/settings/filters/parts/filter-item';

type FilterListProps = {
	filters: Array<Filter>;
	moveDown: (arg: number) => void;
	moveUp: (arg: number) => void;
	selected: Record<string, boolean>;
	toggle: (arg: string) => void;
	unSelect: () => void;
};
export const FilterList = ({
	filters,
	selected,
	unSelect,
	moveUp,
	moveDown,
	toggle
}: FilterListProps): React.JSX.Element => {
	const disableMoveUp = useCallback((index: number) => index === 0, []);
	const disableMoveDown = useCallback(
		(index: number) => index === filters.length - 1,
		[filters.length]
	);
	const filtersList = map(filters, (activeFilter, index) => {
		const isSelected = selected[activeFilter.name];
		const moveUpDisabled = disableMoveUp(index);
		const moveDownDisabled = disableMoveDown(index);
		return (
			<ListItem key={`filter-item-${index}`}>
				{(visible: boolean): React.JSX.Element => (
					<FilterItem
						index={index}
						selected={isSelected}
						unSelect={unSelect}
						item={activeFilter}
						moveDown={moveDown}
						moveUp={moveUp}
						toggle={toggle}
						disableMoveUp={moveUpDisabled}
						disableMoveDown={moveDownDisabled}
					/>
				)}
			</ListItem>
		);
	});
	return <List>{filtersList}</List>;
};
