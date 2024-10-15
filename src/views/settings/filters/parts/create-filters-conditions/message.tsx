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
import type { TFunction } from 'i18next';
import CustomSelect from '../custom-select';
import { getIsOptions, getMessageOptions } from '../utils';
import { CreateFilterContext } from '../create-filter-context';

type ComponentProps = {
	t: TFunction;
	activeIndex: number;
	defaultValue?: any;
};

const MessageCondition: FC<ComponentProps> = ({ t, activeIndex, defaultValue }): ReactElement => {
	const isOptions = useMemo(() => getIsOptions(t), [t]);
	const msgOptions = useMemo(() => getMessageOptions(t), [t]);

	const [loadData, setLoadData] = useState(false);
	const [is, setIs] = useState('TRUE');

	const [selectValue, setSelectValue] = useState({
		value: { where: 'started' },
		key: 'conversationTest'
	});
	const { newFilters, setNewFilters } = useContext(CreateFilterContext);

	useEffect(() => {
		if (loadData) {
			const previousTemp: any = {};
			switch (selectValue.key) {
				case 'conversationTest':
					previousTemp.conversationTest = [
						is === 'FALSE' ? { ...selectValue.value, negative: '1' } : selectValue.value
					];
					break;
				case 'bulkTest':
					previousTemp.bulkTest = [is === 'FALSE' ? { negative: '1' } : {}];
					break;
				case 'listTest':
					previousTemp.listTest = [is === 'FALSE' ? { negative: '1' } : {}];
					break;
				case 'flaggedTest':
					previousTemp.flaggedTest = [
						is === 'FALSE' ? { negative: '1', flagName: 'flagged' } : { flagName: 'flagged' }
					];
					break;
				default:
					previousTemp.conversationTest = [{ where: 'started' }];
			}
			const tmpFilters = newFilters.slice();
			tmpFilters[activeIndex] = {
				...tmpFilters[activeIndex],
				filterTests: [{ ...previousTemp }]
			};

			setNewFilters(tmpFilters);
			setLoadData(false);
		}
	}, [selectValue, activeIndex, newFilters, setNewFilters, loadData, is]);

	const handleIsChange = useCallback((arg: string) => {
		setIs(arg);
		setLoadData(true);
	}, []);

	const handleOptionChange = useCallback(
		(arg: {
			value: {
				where: string;
			};
			key: string;
		}) => {
			setSelectValue(arg);
			setLoadData(true);
		},
		[]
	);

	const defaultIsOption = useMemo(() => {
		if (defaultValue) {
			const test = Object.keys(defaultValue)[0];
			return defaultValue[test][0]?.negative ? isOptions[1] : isOptions[0];
		}
		return isOptions[0];
	}, [defaultValue, isOptions]);
	const defaultMsgOption = useMemo(() => {
		if (defaultValue) {
			const test = Object.keys(defaultValue)[0];
			switch (test) {
				case 'conversationTest': {
					return defaultValue[test][0]?.where === 'started' ? msgOptions[0] : msgOptions[1];
				}
				case 'bulkTest': {
					return msgOptions[2];
				}
				case 'listTest': {
					return msgOptions[3];
				}
				case 'flaggedTest': {
					return msgOptions[4];
				}
				default:
					return msgOptions[0];
			}
		}
		return msgOptions[0];
	}, [defaultValue, msgOptions]);

	return (
		<>
			<Container minWidth="30%" maxWidth="30%" padding={{ right: 'small' }}>
				<CustomSelect
					items={isOptions}
					background="gray5"
					label=""
					onChange={handleIsChange}
					defaultSelection={defaultIsOption}
				/>
			</Container>
			<Container minWidth="30%" maxWidth="30%" padding={{ right: 'small' }}>
				<CustomSelect
					items={msgOptions}
					background="gray5"
					label=""
					onChange={handleOptionChange}
					defaultSelection={defaultMsgOption}
				/>
			</Container>
		</>
	);
};

export default MessageCondition;
