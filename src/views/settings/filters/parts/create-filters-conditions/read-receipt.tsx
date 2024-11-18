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
import { Container } from '@zextras/carbonio-design-system';
import type { TFunction } from 'i18next';
import CustomSelect from '../custom-select';
import { getReadReceiptOptions } from '../utils';
import { CreateFilterContext } from '../create-filter-context';

type ComponentProps = {
	t: TFunction;
	activeIndex: number;
	defaultValue?: any;
};

const ReadReceiptCondition: FC<ComponentProps> = ({
	t,
	activeIndex,
	defaultValue
}): ReactElement => {
	const existsOptions = useMemo(() => getReadReceiptOptions(t), [t]);
	const [query, setQuery] = useState({
		header: 'Content-Type',
		stringComparison: 'Contains',
		value: 'message/disposition-notification'
	});
	const [loadData, setLoadData] = useState(false);
	const { newFilters, setNewFilters } = useContext(CreateFilterContext);

	useEffect(() => {
		if (loadData) {
			const tmpFilters = newFilters.slice();
			tmpFilters[activeIndex] = {
				...tmpFilters[activeIndex],
				filterTests: [
					{
						mimeHeaderTest: [query]
					}
				]
			};

			setNewFilters(tmpFilters);
			setLoadData(false);
		}
	}, [activeIndex, newFilters, setNewFilters, loadData, query]);

	const handleQueryChange = useCallback(
		(arg: { header: string; stringComparison: string; value: string }) => {
			setQuery(arg);
			setLoadData(true);
		},
		[]
	);

	const defaultSelection = useMemo(() => {
		if (defaultValue) {
			return defaultValue?.dateTest?.[0].negative ? existsOptions[0] : existsOptions[1];
		}
		return existsOptions[0];
	}, [existsOptions, defaultValue]);
	return (
		<>
			<Container minWidth="60%" maxWidth="60%" padding={{ right: 'small' }}>
				<CustomSelect
					items={existsOptions}
					background="gray5"
					label=""
					onChange={handleQueryChange}
					defaultSelection={defaultSelection}
				/>
			</Container>
		</>
	);
};

export default ReadReceiptCondition;
