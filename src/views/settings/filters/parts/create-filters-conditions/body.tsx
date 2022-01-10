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
import { Input, Container } from '@zextras/zapp-ui';
import { TFunction } from 'i18next';
import CustomSelect from '../custom-select';
import { getBodyOptions } from '../utils';
import { CreateFilterContext } from '../create-filter-context';

type ComponentProps = {
	t: TFunction;
	activeIndex: number;
	defaultValue?: any;
};

const BodyCondition: FC<ComponentProps> = ({ t, activeIndex, defaultValue }): ReactElement => {
	const bodyOptions = useMemo(() => getBodyOptions(t), [t]);
	const [query, setQuery] = useState({ value: '' });
	const [value, setValue] = useState('');
	const [loadData, setLoadData] = useState(false);
	const { newFilters, setNewFilters } = useContext(CreateFilterContext);
	useEffect(() => {
		if (loadData) {
			const tmpFilters = newFilters.slice();
			tmpFilters[activeIndex] = {
				...tmpFilters[activeIndex],
				filterTests: [
					{
						bodyTest: [{ ...query, value }]
					}
				]
			};

			setNewFilters(tmpFilters);
			setLoadData(false);
		}
	}, [activeIndex, newFilters, setNewFilters, loadData, query, value]);

	useEffect(() => {
		if (defaultValue && defaultValue.bodyTest) {
			setValue(defaultValue.bodyTest[0].value);
		}
	}, [defaultValue]);
	const handleQueryChange = useCallback((arg) => {
		setQuery(arg);
		setLoadData(true);
	}, []);

	const handleValueChange = useCallback((ev) => {
		setValue(ev.target.value);
		setLoadData(true);
	}, []);

	const defaultBodyOption = useMemo(() => {
		if (defaultValue && defaultValue.bodyTest[0].negative) {
			return bodyOptions[1];
		}
		return bodyOptions[0];
	}, [defaultValue, bodyOptions]);
	return (
		<>
			<Container minWidth="30%" maxWidth="30%" padding={{ right: 'small' }}>
				<CustomSelect
					items={bodyOptions}
					background="gray5"
					label=""
					onChange={handleQueryChange}
					defaultSelection={defaultBodyOption}
				/>
			</Container>
			<Container minWidth="30%" padding={{ right: 'small' }}>
				<Input
					onChange={handleValueChange}
					placeholder={t('settings.keyword', 'Keyword')}
					backgroundColor="gray5"
					value={value}
				/>
			</Container>
		</>
	);
};

export default BodyCondition;
