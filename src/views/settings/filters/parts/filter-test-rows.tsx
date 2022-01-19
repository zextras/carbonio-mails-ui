/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo, useCallback } from 'react';
import { Container, Padding, Icon, Tooltip } from '@zextras/carbonio-design-system';

import styled from 'styled-components';
import { filter, indexOf } from 'lodash';
import { getStatusOptions, findDefaultValue } from './utils';
import DefaultCondition from './create-filters-conditions/default';
import CustomSelect from './custom-select';
import { getRowFunc } from './get-row';

export const StyledIcon = styled(Icon)`
	border: 1px solid
		${({ theme, disabled, color }): string =>
			disabled ? theme.palette.gray2.regular : theme.palette[color].regular};
	border-radius: 4px;
	width: 32px;
	height: 32px;
	max-width: 32px;
	max-height: 32px;
	padding: 4px;
`;

type FilterTestRowProps = {
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

const FilterTestRows: FC<FilterTestRowProps> = ({ tmpFilter, index, compProps }): ReactElement => {
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
		(indexToRemove) => (): void => {
			const previousNewFilters = newFilters.slice();
			const toRemove = filter(previousNewFilters, { index: indexToRemove })[0];
			previousNewFilters.splice(indexOf(previousNewFilters, toRemove), 1);
			setNewFilters(previousNewFilters);
		},
		[newFilters, setNewFilters]
	);

	const disableRemove = useMemo(() => newFilters.length === 1, [newFilters]);

	const getRow = useCallback(
		(indexToGet) => getRowFunc({ index: indexToGet, setNewFilters, newFilters, t, condition }),
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
					onChange={getRow(index)}
					defaultSelection={defaultSelection}
				/>
			</Container>

			{tmpFilter.comp && tmpFilter.comp}

			<Container orientation="horizontal" mainAlignment="flex-end">
				<Tooltip label={t('settings.add_condition', 'Add new condition')} placement="top">
					<StyledIcon onClick={addFilterCondition} icon="PlusOutline" color="primary" />
				</Tooltip>
				<Padding left="small">
					<Tooltip label={t('settings.remove_condition', 'Remove this condition')} placement="top">
						<StyledIcon
							icon="MinusOutline"
							disabled={disableRemove}
							onClick={onRemove}
							color="secondary"
						/>
					</Tooltip>
				</Padding>
			</Container>
		</Container>
	);
};

export default FilterTestRows;
