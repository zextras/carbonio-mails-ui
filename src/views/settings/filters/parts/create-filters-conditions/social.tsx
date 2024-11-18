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
import { Container } from '@zextras/carbonio-design-system';
import type { TFunction } from 'i18next';
import CustomSelect from '../custom-select';
import { getSocialOptions } from '../utils';
import { CreateFilterContext } from '../create-filter-context';

type ComponentProps = {
	t: TFunction;
	activeIndex: number;
	defaultValue?: any;
};

const SocialCondition: FC<ComponentProps> = ({ t, activeIndex, defaultValue }): ReactElement => {
	const socialOptions = useMemo(() => getSocialOptions(t), [t]);
	const [query, setQuery] = useState({ linkedinTest: [{}] });
	const [loadData, setLoadData] = useState(false);
	const { newFilters, setNewFilters } = useContext(CreateFilterContext);

	useEffect(() => {
		if (loadData) {
			const tmpFilters = newFilters.slice();
			tmpFilters[activeIndex] = {
				...tmpFilters[activeIndex],
				filterTests: [{ ...query }]
			};
			setNewFilters(tmpFilters);
			setLoadData(false);
		}
	}, [activeIndex, newFilters, setNewFilters, loadData, query]);

	const handleQueryChange = useCallback((arg: { linkedinTest: [] }) => {
		setQuery(arg);
		setLoadData(true);
	}, []);

	const defaultSelection = useMemo(() => {
		if (defaultValue) {
			switch (Object.keys(defaultValue)[0]) {
				case 'linkedinTest':
					return socialOptions[0];
				case 'twitterTest':
					return socialOptions[1];
				default:
					return socialOptions[2];
			}
		}
		return socialOptions[0];
	}, [defaultValue, socialOptions]);

	return (
		<>
			<Container minWidth="60%" maxWidth="60%" padding={{ right: 'small' }}>
				<CustomSelect
					items={socialOptions}
					background="gray5"
					label=""
					onChange={handleQueryChange}
					defaultSelection={defaultSelection}
				/>
			</Container>
		</>
	);
};

export default SocialCondition;
