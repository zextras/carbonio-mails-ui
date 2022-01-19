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
import { Container, DateTimePicker } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import moment from 'moment';
import CustomSelect from '../custom-select';
import { getDateOptions, findDefaultValue } from '../utils';
import { CreateFilterContext } from '../create-filter-context';

type ComponentProps = {
	t: TFunction;
	activeIndex: number;
	defaultValue?: any;
};

const DateCondition: FC<ComponentProps> = ({ t, activeIndex, defaultValue }): ReactElement => {
	const dateOptions = useMemo(() => getDateOptions(t), [t]);
	const [query, setQuery] = useState({ dateComparison: 'before' });
	const [date, setDate] = useState(moment().format('X'));
	const [loadData, setLoadData] = useState(false);
	const { newFilters, setNewFilters } = useContext(CreateFilterContext);
	useEffect(() => {
		if (loadData) {
			const tmpFilters = newFilters.slice();
			tmpFilters[activeIndex] = {
				...tmpFilters[activeIndex],
				filterTests: [
					{
						dateTest: [{ ...query, d: `${date}` }]
					}
				]
			};

			setNewFilters(tmpFilters);
			setLoadData(false);
		}
	}, [activeIndex, newFilters, setNewFilters, loadData, query, date]);

	const handleQueryChange = useCallback((arg) => {
		setQuery(arg);
		setLoadData(true);
	}, []);

	const handleDateChange = useCallback((arg) => {
		setDate(`${moment(arg).format('X')}`);
		setLoadData(true);
	}, []);

	const defaultSelection = useMemo(
		() =>
			defaultValue
				? findDefaultValue(
						dateOptions,
						defaultValue?.dateTest?.[0].negative
							? { dateComparison: defaultValue?.dateTest?.[0]?.dateComparison, negative: '1' }
							: { dateComparison: defaultValue?.dateTest?.[0]?.dateComparison }
				  )
				: dateOptions[0],
		[dateOptions, defaultValue]
	);

	const defaultDate = useMemo(
		() =>
			defaultValue?.dateTest?.[0]?.d
				? new Date((defaultValue?.dateTest?.[0]?.d ?? 1) * 1000)
				: new Date(),
		[defaultValue]
	);

	return (
		<>
			<Container minWidth="40%" maxWidth="40%" padding={{ right: 'small' }}>
				<CustomSelect
					items={dateOptions}
					background="gray5"
					label=""
					onChange={handleQueryChange}
					defaultSelection={defaultSelection}
				/>
			</Container>
			<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
				<DateTimePicker
					includeTime={false}
					defaultValue={defaultDate}
					label={t('settings.choose_date', 'Choose Date')}
					backgroundColor="gray5"
					onChange={handleDateChange}
					dateFormat="d/M/yyyy"
				/>
			</Container>
		</>
	);
};

export default DateCondition;
