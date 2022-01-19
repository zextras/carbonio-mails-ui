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
	useEffect,
	useState
} from 'react';
import { Input, Container } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import CustomSelect from '../custom-select';
import { getConditionStatements } from '../utils';
import { CreateFilterContext } from '../create-filter-context';

type ComponentProps = {
	t: TFunction;
	activeIndex: number;
};

const HeaderCondition: FC<ComponentProps> = ({ t, activeIndex }): ReactElement => {
	const conditionStatementsOptions = useMemo(() => getConditionStatements(t), [t]);

	const [loadData, setLoadData] = useState(false);
	const [query, setQuery] = useState({ stringComparison: 'contains' });
	const [header, setHeader] = useState('header');
	const [value, setValue] = useState('');

	const { newFilters, setNewFilters } = useContext(CreateFilterContext);

	useEffect(() => {
		if (loadData) {
			const tmpFilters = newFilters.slice();

			tmpFilters[activeIndex] = {
				...tmpFilters[activeIndex],
				filterTests: [
					{
						headerTest: [{ header, ...query, value }]
					}
				]
			};
			setNewFilters(tmpFilters);
			setLoadData(false);
		}
	}, [activeIndex, newFilters, setNewFilters, value, loadData, header, query]);

	const handleQueryChange = useCallback((arg) => {
		setQuery(arg);
		setLoadData(true);
	}, []);

	const handleValueChange = useCallback((ev) => {
		setValue(ev.target.value);
		setLoadData(true);
	}, []);

	const handleHeaderChange = useCallback((ev) => {
		setHeader(ev.target.value);
		setLoadData(true);
	}, []);

	return (
		<>
			<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
				<Input backgroundColor="gray5" defaultValue="header" onChange={handleHeaderChange} />
			</Container>
			<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
				<CustomSelect
					items={conditionStatementsOptions}
					background="gray5"
					label=""
					onChange={handleQueryChange}
					defaultSelection={conditionStatementsOptions[2]}
				/>
			</Container>
			<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
				<Input backgroundColor="gray5" onChange={handleValueChange} />
			</Container>
		</>
	);
};

export default HeaderCondition;
