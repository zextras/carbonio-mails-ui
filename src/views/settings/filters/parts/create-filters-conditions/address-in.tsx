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
import { Container } from '@zextras/carbonio-design-system';
import type { TFunction } from 'i18next';
import CustomSelect from '../custom-select';
import { getFromOptions, getInOptions, getFolderOptions, findDefaultValue } from '../utils';
import { CreateFilterContext } from '../create-filter-context';

type ComponentProps = {
	t: TFunction;
	activeIndex: number;
	defaultValue?: any;
};

const AddressInCondition: FC<ComponentProps> = ({ t, activeIndex, defaultValue }): ReactElement => {
	const fromOptions = useMemo(() => getFromOptions(t), [t]);
	const inOptions = useMemo(() => getInOptions(t), [t]);
	const folderOptions = useMemo(() => getFolderOptions(t), [t]);
	const [query, setQuery] = useState({ header: 'from' });
	const [header, setHeader] = useState('FROM');
	const [sender, setSender] = useState({ key: '', value: {} });
	const [type, setType] = useState('addressBookTest');
	const [loadData, setLoadData] = useState(false);

	const { newFilters, setNewFilters } = useContext(CreateFilterContext);
	useEffect(() => {
		if (loadData) {
			const tmpFilters = newFilters.slice();

			tmpFilters[activeIndex] = {
				...tmpFilters[activeIndex],
				filterTests: [
					sender.key === 'in'
						? {
								addressBookTest: [{ header, type: 'contacts', ...sender.value }]
							}
						: {
								contactRankingTest: [{ header, type: 'contacts', ...sender.value }]
							}
				]
			};
			setNewFilters(tmpFilters);
			setLoadData(false);
		}
	}, [activeIndex, newFilters, setNewFilters, loadData, query, header, sender]);

	const handleFromChange = useCallback((arg: string) => {
		setHeader(arg);
		setLoadData(true);
	}, []);

	const handleSenderChange = useCallback((arg: { key: string; value: object }) => {
		setSender(arg);
		setLoadData(true);
	}, []);

	const handleTypeChange = useCallback((arg: string) => {
		setType(arg);
		setLoadData(true);
	}, []);

	const defaultFromOption = useMemo(() => {
		if (defaultValue) {
			return findDefaultValue(fromOptions, defaultValue[Object.keys(defaultValue)[0]][0].header);
		}
		return fromOptions[0];
	}, [fromOptions, defaultValue]);

	const defaultInOption = useMemo(() => {
		if (defaultValue) {
			const test = Object.keys(defaultValue)[0];
			if (test === 'meTest') {
				return defaultValue[Object.keys(defaultValue)[0]][0].negative ? inOptions[3] : inOptions[2];
			}
			return defaultValue[Object.keys(defaultValue)[0]][0].negative ? inOptions[1] : inOptions[0];
		}
		return inOptions[0];
	}, [inOptions, defaultValue]);

	const showFolderOption = useMemo(() => {
		if (defaultValue) {
			const test = Object.keys(defaultValue)[0];
			if (test === 'meTest' || sender.key === 'myTest') return false;
			return true;
		}
		return sender.key !== 'myTest';
	}, [defaultValue, sender]);

	const defaultFolderOption = useMemo(() => {
		if (defaultValue) {
			const test = Object.keys(defaultValue)[0];
			return test === 'contactRankingTest' ? folderOptions[1] : folderOptions[0];
		}
		return folderOptions[0];
	}, [folderOptions, defaultValue]);
	return (
		<>
			<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
				<CustomSelect
					items={fromOptions}
					background="gray5"
					label=""
					onChange={handleFromChange}
					defaultSelection={defaultFromOption}
				/>
			</Container>
			<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
				<CustomSelect
					items={inOptions}
					background="gray5"
					label=""
					onChange={handleSenderChange}
					defaultSelection={defaultInOption}
				/>
			</Container>
			{showFolderOption && (
				<Container minWidth="20%" maxWidth="20%" padding={{ right: 'small' }}>
					<CustomSelect
						items={folderOptions}
						background="gray5"
						label=""
						onChange={handleTypeChange}
						defaultSelection={defaultFolderOption}
					/>
				</Container>
			)}
		</>
	);
};

export default AddressInCondition;
