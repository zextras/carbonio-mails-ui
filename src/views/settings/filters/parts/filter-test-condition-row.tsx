/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo } from 'react';
import { Container, Padding, Row, Text } from '@zextras/zapp-ui';
import { map } from 'lodash';
import Heading from '../../components/settings-heading';
import CustomSelect from './custom-select';
import { getFieldOptions, findDefaultValue } from './utils';
import FilterTestRows from './filter-test-rows';

type FilterTestConditionRowProps = any;

const FilterTestConditionRow: FC<FilterTestConditionRowProps> = ({ compProps }): ReactElement => {
	const { t, newFilters, setCondition, selectedFilter } = compProps;
	const fieldOptions = useMemo(() => getFieldOptions(t), [t]);

	const defaultSelection = useMemo(
		() =>
			findDefaultValue(fieldOptions, selectedFilter?.filterTests?.[0]?.condition) ||
			fieldOptions[0],
		[fieldOptions, selectedFilter]
	);

	return (
		<>
			<Heading title={t('settings.conditions', 'Conditions')} size="medium" />
			<Row>
				<Row padding={{ right: 'small' }}>
					<Text>{t('settings.if', 'If')}</Text>
				</Row>
				<Row padding={{ right: 'small' }} minWidth="95px">
					<CustomSelect
						items={fieldOptions}
						background="gray5"
						label={t('settings.field', 'Field')}
						onChange={setCondition}
						defaultSelection={defaultSelection}
					/>
				</Row>
				<Row padding={{ right: 'small' }}>
					<Text>{t('settings.condition_met')}</Text>
				</Row>
			</Row>
			<Padding top="small" />
			<Container maxHeight="200px" style={{ overflow: 'auto' }} padding={{ top: 'small' }}>
				{map(newFilters, (tmpFilter, index) => (
					<FilterTestRows
						key={`tmp-filter-${tmpFilter.key}-${index}`}
						index={index}
						tmpFilter={tmpFilter}
						compProps={compProps}
					/>
				))}
			</Container>
		</>
	);
};
export default FilterTestConditionRow;
