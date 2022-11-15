/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo, useCallback } from 'react';
import { Container, Padding, IconButton, Tooltip, getColor } from '@zextras/carbonio-design-system';

import styled from 'styled-components';
import { getStatusOptions, findDefaultValue } from './utils';
import DefaultCondition from './create-filters-conditions/default';
import CustomSelect from './custom-select';
import { getRowFunc } from './get-row';

export const StyledIconButton = styled(IconButton)`
	border: 0.0625rem solid
		${({ theme, disabled, iconColor = 'primary' }): string =>
			disabled ? theme.palette.gray2.regular : getColor(iconColor, theme)};
	svg {
		border: none !important;
	}
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
			previousNewFilters.splice(indexToRemove, 1);
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
					<StyledIconButton icon="PlusOutline" onClick={addFilterCondition} iconColor="primary" />
				</Tooltip>
				<Padding left="small">
					<Tooltip label={t('settings.remove_condition', 'Remove this condition')} placement="top">
						<StyledIconButton
							disabled={disableRemove}
							icon="MinusOutline"
							onClick={onRemove}
							iconColor="secondary"
						/>
					</Tooltip>
				</Padding>
			</Container>
		</Container>
	);
};

export default FilterTestRows;
