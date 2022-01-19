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
import { Container } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import CustomSelect from '../custom-select';
import { getInviteRspOptions } from '../utils';
import { CreateFilterContext } from '../create-filter-context';

type ComponentProps = {
	t: TFunction;
	activeIndex: number;
	defaultValue?: any;
};

const CalendarCondition: FC<ComponentProps> = ({ t, activeIndex, defaultValue }): ReactElement => {
	const inviteRspOptions = useMemo(() => getInviteRspOptions(t), [t]);
	const [query, setQuery] = useState({ method: [{ _content: 'anyreply' }] });
	const [loadData, setLoadData] = useState(false);
	const { newFilters, setNewFilters } = useContext(CreateFilterContext);

	useEffect(() => {
		if (loadData) {
			const tmpFilters = newFilters.slice();
			tmpFilters[activeIndex] = {
				...tmpFilters[activeIndex],
				filterTests: [
					{
						inviteTest: [query]
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

	const defaultOption = useMemo(() => {
		if (defaultValue) {
			if (defaultValue.inviteTest[0].method[0]._content === 'anyrequest') {
				return defaultValue.inviteTest[0].negative ? inviteRspOptions[1] : inviteRspOptions[0];
			}
			return defaultValue.inviteTest[0].negative ? inviteRspOptions[3] : inviteRspOptions[2];
		}
		return inviteRspOptions[2];
	}, [defaultValue, inviteRspOptions]);

	return (
		<>
			<Container minWidth="60%" maxWidth="60%" padding={{ right: 'small' }}>
				<CustomSelect
					items={inviteRspOptions}
					background="gray5"
					label=""
					onChange={handleQueryChange}
					defaultSelection={defaultOption}
				/>
			</Container>
		</>
	);
};

export default CalendarCondition;
