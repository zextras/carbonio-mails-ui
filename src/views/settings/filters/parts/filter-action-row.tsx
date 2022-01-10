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
import { getFieldOptions } from './utils';
import FilterActionRows from './filter-action-rows';

type FilterActionRowProps = any;

const FilterTestConditionRow: FC<FilterActionRowProps> = ({
	compProps,
	modalProps
}): ReactElement => {
	const { t, newFilters, setCondition } = compProps;
	const fieldOptions = useMemo(() => getFieldOptions(t), [t]);
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
						defaultSelection={fieldOptions[0]}
					/>
				</Row>
				<Row padding={{ right: 'small' }}>
					<Text>{t('settings.condition_met', 'of the following conditions are met:')}</Text>
				</Row>
			</Row>
			<Padding top="small" />
			<Container maxHeight="140px" style={{ overflow: 'auto' }} padding={{ top: 'small' }}>
				{map(newFilters, (tmpFilter, index) => (
					<FilterActionRows
						key={index}
						index={index}
						tmpFilter={tmpFilter}
						compProps={compProps}
						modalProps={modalProps}
					/>
				))}
			</Container>
		</>
	);
};
export default FilterTestConditionRow;
