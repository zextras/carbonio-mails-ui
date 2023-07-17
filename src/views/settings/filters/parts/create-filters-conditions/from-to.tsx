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
	useState,
	useCallback,
	useEffect
} from 'react';
import { Input, Container } from '@zextras/carbonio-design-system';
import type { TFunction } from 'i18next';
import CustomSelect from '../custom-select';
import { getConditionStatements, findDefaultValue, getDomainOptions } from '../utils';
import { CreateFilterContext } from '../create-filter-context';

type ComponentProps = {
	t: TFunction;
	activeIndex: number;
	defaultValue?: any;
};

const FromToCondition: FC<ComponentProps> = ({ t, activeIndex, defaultValue }): ReactElement => {
	const conditionStatementsOptions = useMemo(() => getConditionStatements(t), [t]);
	const domainOptions = useMemo(() => getDomainOptions(t), [t]);

	const [loadData, setLoadData] = useState(false);
	const [value, setValue] = useState('');
	const [part, setPart] = useState('all');
	const [selectValue, setSelectValue] = useState({ stringComparison: 'contains' });
	const { newFilters, setNewFilters } = useContext(CreateFilterContext);
	useEffect(() => {
		if (defaultValue && defaultValue?.addressTest) {
			setValue(defaultValue?.addressTest?.[0]?.value);
		}
	}, [defaultValue]);
	useEffect(() => {
		if (loadData) {
			const tmpFilters = newFilters.slice();

			tmpFilters[activeIndex] = {
				...tmpFilters[activeIndex],
				filterTests: [
					{
						...tmpFilters[activeIndex].filterTests[0],
						addressTest: [{ header: tmpFilters[activeIndex].key, ...selectValue, value, part }]
					}
				]
			};
			setNewFilters(tmpFilters);
			setLoadData(false);
		}
	}, [selectValue, activeIndex, newFilters, setNewFilters, value, loadData, part]);

	const handleStatementChange = useCallback((arg) => {
		setSelectValue(arg);
		setLoadData(true);
	}, []);

	const handleValueChange = useCallback((ev) => {
		setValue(ev.target.value);
		setLoadData(true);
	}, []);

	const handelPartChange = useCallback((arg) => {
		setPart(arg);
		setLoadData(true);
	}, []);
	const defaultSelection = useMemo(
		() =>
			defaultValue
				? findDefaultValue(
						conditionStatementsOptions,
						defaultValue.addressTest?.[0]?.negative
							? {
									stringComparison: defaultValue?.addressTest?.[0]?.stringComparison,
									negative: '1'
							  }
							: { stringComparison: defaultValue?.addressTest?.[0]?.stringComparison }
				  )
				: conditionStatementsOptions[2],
		[conditionStatementsOptions, defaultValue]
	);

	const defaultDomain = useMemo(
		() =>
			defaultValue
				? findDefaultValue(domainOptions, defaultValue.addressTest[0].part)
				: domainOptions[0],
		[domainOptions, defaultValue]
	);
	return (
		<>
			<Container minWidth="30%" maxWidth="30%" padding={{ right: 'small' }}>
				<CustomSelect
					items={conditionStatementsOptions}
					background="gray5"
					label=""
					onChange={handleStatementChange}
					defaultSelection={defaultSelection}
				/>
			</Container>
			<Container minWidth="10%" maxWidth="10%" padding={{ right: 'small' }}>
				<CustomSelect
					items={domainOptions}
					background="gray5"
					label=""
					onChange={handelPartChange}
					defaultSelection={defaultDomain}
				/>
			</Container>
			<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
				<Input
					backgroundColor="gray5"
					value={value}
					onChange={handleValueChange}
					placeholder={t('settings.keyword', 'Keyword')}
				/>
			</Container>
		</>
	);
};

export default FromToCondition;
