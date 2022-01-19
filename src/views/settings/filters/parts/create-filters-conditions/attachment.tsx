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
import { TFunction } from 'i18next';
import CustomSelect from '../custom-select';
import { getExistOptions, findDefaultValue } from '../utils';
import { CreateFilterContext } from '../create-filter-context';

type ComponentProps = {
	t: TFunction;
	activeIndex: number;
	defaultValue?: any;
};

const AttachmentCondition: FC<ComponentProps> = ({
	t,
	activeIndex,
	defaultValue
}): ReactElement => {
	const existsOptions = useMemo(() => getExistOptions(t), [t]);
	const [query, setQuery] = useState({});
	const [loadData, setLoadData] = useState(false);
	const { newFilters, setNewFilters } = useContext(CreateFilterContext);

	const defaultOption = useMemo(() => {
		if (defaultValue && defaultValue.attachmentTest[0].negative) {
			return existsOptions[1];
		}
		return existsOptions[0];
	}, [defaultValue, existsOptions]);

	useEffect(() => {
		if (loadData) {
			const tmpFilters = newFilters.slice();
			tmpFilters[activeIndex] = {
				...tmpFilters[activeIndex],
				filterTests: [
					{
						attachmentTest: [query]
					}
				]
			};

			setNewFilters(tmpFilters);
			setLoadData(false);
		}
	}, [activeIndex, newFilters, setNewFilters, loadData, query]);

	const handleQueryChange = useCallback((arg) => {
		setQuery(arg);
		setLoadData(true);
	}, []);

	return (
		<>
			<Container minWidth="60%" maxWidth="60%" padding={{ right: 'small' }}>
				<CustomSelect
					items={existsOptions}
					background="gray5"
					label=""
					onChange={handleQueryChange}
					defaultSelection={defaultOption}
				/>
			</Container>
		</>
	);
};

export default AttachmentCondition;
