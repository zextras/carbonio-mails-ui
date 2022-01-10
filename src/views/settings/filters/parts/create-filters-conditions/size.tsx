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
	useEffect,
	useCallback
} from 'react';
import { Input, Container } from '@zextras/zapp-ui';
import { TFunction } from 'i18next';
import { includes } from 'lodash';
import CustomSelect from '../custom-select';
import { getSizeOptions, getSizeUnit, findDefaultValue } from '../utils';
import { CreateFilterContext } from '../create-filter-context';

type ComponentProps = {
	t: TFunction;
	activeIndex: number;
	defaultValue?: any;
};

const SizeCondition: FC<ComponentProps> = ({ t, activeIndex, defaultValue }): ReactElement => {
	const sizeOptions = useMemo(() => getSizeOptions(t), [t]);
	const sizeUnitsOptions = useMemo(() => getSizeUnit(t), [t]);
	const [query, setQuery] = useState({ numberComparison: 'under' });
	const [sizeUnit, setSizeUnit] = useState('');
	const [size, setSize] = useState('');
	const [loadData, setLoadData] = useState(false);
	const { newFilters, setNewFilters } = useContext(CreateFilterContext);

	useEffect(() => {
		if (loadData) {
			const tmpFilters = newFilters.slice();
			tmpFilters[activeIndex] = {
				...tmpFilters[activeIndex],
				filterTests: [
					{
						sizeTest: [{ ...query, s: `${size}${sizeUnit}` }]
					}
				]
			};

			setNewFilters(tmpFilters);
			setLoadData(false);
		}
	}, [activeIndex, newFilters, setNewFilters, loadData, query, size, sizeUnit]);

	const handleQueryChange = useCallback((arg) => {
		setQuery(arg);
		setLoadData(true);
	}, []);

	const handleSizeUnitChange = useCallback((arg) => {
		setSizeUnit(arg);
		setLoadData(true);
	}, []);

	const handleSizeChange = useCallback((ev) => {
		setSize(ev.target.value);
		setLoadData(true);
	}, []);

	const defaultSizeOption = useMemo(
		() =>
			defaultValue
				? findDefaultValue(
						sizeOptions,
						defaultValue?.sizeTest?.[0]?.negative
							? { numberComparison: defaultValue?.sizeTest?.[0]?.numberComparison, negative: '1' }
							: { numberComparison: defaultValue?.sizeTest?.[0]?.numberComparison }
				  )
				: sizeOptions[0],
		[defaultValue, sizeOptions]
	);
	const defaultSizeUnitOption = useMemo(() => {
		if (defaultValue) {
			const sizeArray = defaultValue?.sizeTest?.[0]?.s?.split('');
			const unit = sizeArray.pop();
			if (includes(['M', 'G', 'K'], unit)) {
				return findDefaultValue(sizeUnitsOptions, unit);
			}
			return findDefaultValue(sizeUnitsOptions, '');
		}
		return sizeUnitsOptions[0];
	}, [defaultValue, sizeUnitsOptions]);

	useEffect(() => {
		if (defaultValue && defaultValue?.sizeTest) {
			const sizeArray = defaultValue?.sizeTest?.[0]?.s?.split('');
			const unit = sizeArray.pop();
			if (includes(['M', 'G', 'K'], unit)) {
				setSize(sizeArray.join(''));
			} else setSize(defaultValue?.sizeTest?.[0]?.s);
		}
	}, [defaultValue]);
	return (
		<>
			<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
				<CustomSelect
					items={sizeOptions}
					background="gray5"
					label=""
					onChange={handleQueryChange}
					defaultSelection={defaultSizeOption}
				/>
			</Container>
			<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
				<Input
					type="number"
					onChange={handleSizeChange}
					value={size}
					backgroundColor="gray5"
					placeholder="0"
				/>
			</Container>
			<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
				<CustomSelect
					items={sizeUnitsOptions}
					background="gray5"
					label=""
					onChange={handleSizeUnitChange}
					defaultSelection={defaultSizeUnitOption}
				/>
			</Container>
		</>
	);
};

export default SizeCondition;
