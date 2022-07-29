/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	FC,
	ReactElement,
	useMemo,
	useContext,
	useCallback,
	useState,
	useEffect
} from 'react';
import { Input, Container } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import CustomSelect from '../custom-select';
import { getConditionStatements, findDefaultValue } from '../utils';
import { CreateFilterContext } from '../create-filter-context';

type ComponentProps = {
	t: TFunction;
	activeIndex: number;
	defaultValue?: any;
};

const DefaultCondition: FC<ComponentProps> = ({ t, activeIndex, defaultValue }): ReactElement => {
	const conditionStatementsOptions = useMemo(() => getConditionStatements(t), [t]);
	const [loadData, setLoadData] = useState(false);
	const [value, setValue] = useState('');
	const [selectValue, setSelectValue] = useState({ stringComparison: 'contains' });
	const { newFilters, setNewFilters } = useContext(CreateFilterContext);

	useEffect(() => {
		if (loadData) {
			const tmpFilters = newFilters.slice();

			tmpFilters[activeIndex] = {
				...tmpFilters[activeIndex],
				filterTests: [
					{
						...tmpFilters?.[activeIndex]?.filterTests?.[0],
						headerTest: [{ header: 'subject', ...selectValue, value }]
					}
				]
			};
			setNewFilters(tmpFilters);
			setLoadData(false);
		}
	}, [selectValue, activeIndex, newFilters, setNewFilters, value, loadData]);
	useEffect(() => {
		if (defaultValue && defaultValue?.headerTest) {
			setValue(defaultValue?.headerTest?.[0]?.value);
		}
	}, [defaultValue]);
	const handleStatementChange = useCallback((arg) => {
		setSelectValue(arg);
		setLoadData(true);
	}, []);

	const handleValueChange = useCallback((ev) => {
		setValue(ev.target.value);
		setLoadData(true);
	}, []);

	const previousOption = useMemo(
		() =>
			defaultValue?.headerTest?.[0].negative
				? { stringComparison: defaultValue?.headerTest?.[0]?.stringComparison, negative: '1' }
				: { stringComparison: defaultValue?.headerTest?.[0].stringComparison },
		[defaultValue]
	);

	const defaultSelection = useMemo(
		() =>
			defaultValue
				? findDefaultValue(conditionStatementsOptions, previousOption)
				: conditionStatementsOptions[2],
		[conditionStatementsOptions, defaultValue, previousOption]
	);

	return (
		<>
			<Container minWidth="40%" maxWidth="40%" padding={{ right: 'small' }}>
				<CustomSelect
					items={conditionStatementsOptions}
					background="gray5"
					label=""
					onChange={handleStatementChange}
					defaultSelection={defaultSelection}
				/>
			</Container>
			<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
				<Input
					label=""
					backgroundColor="gray5"
					value={value}
					placeholder={t('settings.keyword', 'Keyword')}
					onChange={handleValueChange}
				/>
			</Container>
		</>
	);
};

export default DefaultCondition;
