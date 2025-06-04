/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo, useCallback } from 'react';

import { Button, Container, Padding, Tooltip } from '@zextras/carbonio-design-system';

import DefaultCondition from 'views/settings/filters/parts/create-filters-conditions/default';
import CustomSelect from 'views/settings/filters/parts/custom-select';
import { getRowFunc } from 'views/settings/filters/parts/get-row';
import { getStatusOptions, findDefaultValue } from 'views/settings/filters/parts/utils';

type FilterConditionRowrops = {
	tmpFilter: {
		filterActions: Array<any>;
		active: boolean;
		name: string;
		key: string;
		label: string;
		index: number;
		filterTests: Array<any>;
		comp: ReactElement;
	};
	index: string;
	compProps: any;
};

export const FilterConditionRow: FC<FilterConditionRowrops> = ({
	tmpFilter,
	index,
	compProps
}): ReactElement => {
	const { t, newFilters, setNewFilters, condition, activeFilter, filterName } = compProps;
	const statusOptions = useMemo(() => getStatusOptions(t), [t]);

	const addFilterCondition = useCallback(() => {
		const previousNewFilters = newFilters.slice();
		previousNewFilters.push({
			filterActions: [{ actionKeep: [{}], actionStop: [{}] }],
			active: activeFilter,
			name: filterName,
			key: 'subject',
			label: 'Subject',
			index: newFilters.length,
			filterTests: [{}],
			comp: <DefaultCondition t={t} activeIndex={newFilters.length} />
		});
		setNewFilters(previousNewFilters);
	}, [newFilters, t, activeFilter, filterName, setNewFilters]);

	const removeFilterCondition = useCallback(
		(indexToRemove: string) => (): void => {
			const previousNewFilters = newFilters.slice();
			previousNewFilters.splice(indexToRemove, 1);
			setNewFilters(previousNewFilters);
		},
		[newFilters, setNewFilters]
	);

	const disableRemove = useMemo(() => newFilters.length === 1, [newFilters]);

	const getRow = useCallback(
		(indexToGet: number) =>
			getRowFunc({ index: indexToGet, setNewFilters, newFilters, t, condition }),
		[setNewFilters, newFilters, t, condition]
	);

	const defaultSelection = useMemo(
		() => findDefaultValue(statusOptions, tmpFilter.key),
		[tmpFilter, statusOptions]
	);

	const onRemove = useMemo(
		() => (disableRemove ? (): null => null : removeFilterCondition(index)),
		[disableRemove, removeFilterCondition, index]
	);

	return (
		<Container orientation="horizontal" padding={{ top: 'small' }}>
			<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
				<CustomSelect
					items={statusOptions}
					label=""
					onChange={getRow(parseInt(index, 10))}
					defaultSelection={defaultSelection}
				/>
			</Container>

			{tmpFilter.comp}

			<Container orientation="horizontal" mainAlignment="flex-end">
				<Tooltip label={t('settings.add_condition', 'Add new condition')} placement="top">
					<Button icon="PlusOutline" onClick={addFilterCondition} color="primary" type="outlined" />
				</Tooltip>
				<Padding left="small">
					<Tooltip label={t('settings.remove_condition', 'Remove this condition')} placement="top">
						<Button
							disabled={disableRemove}
							icon="MinusOutline"
							onClick={onRemove}
							color="secondary"
							type="outlined"
						/>
					</Tooltip>
				</Padding>
			</Container>
		</Container>
	);
};
