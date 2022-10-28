/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Container,
	Divider,
	Padding,
	SnackbarManagerContext,
	TabBar,
	TabBarProps
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import React, {
	FC,
	ReactElement,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState
} from 'react';
import { useDispatch } from 'react-redux';
import { getIncomingFilters } from '../../../../store/actions/get-incoming-filters';
import { getOutgoingFilters } from '../../../../store/actions/get-outgoing-filters';
import { FilterContext } from './filter-context';
import IncomingMessageFilterTab from './incoming-message-filter-tab';
import OutgoingMessageFilterTab from './outgoing-message-filter-tab';

type Item = {
	active: boolean;
	filterActions: Array<any>;
	filterTests: Array<any>;
	id?: string;
	name: string;
};

const FilterTabs: FC = (): ReactElement => {
	const createSnackbar = useContext(SnackbarManagerContext);
	const [selectedFilterType, setSelectedFilterType] = useState('incoming-messages');
	const tabs = useMemo(
		() => [
			{
				id: 'incoming-messages',
				label: t('filters.incoming_msg_filters', 'Incoming Message Filters')
			},
			{
				id: 'outgoing-messages',
				label: t('filters.outgoing_message_filters', 'Outgoing Message Filters')
			}
		],
		[]
	);
	const onChange = useCallback<TabBarProps['onChange']>((ev, selectedId) => {
		setSelectedFilterType(selectedId);
	}, []);
	const dispatch = useDispatch();
	const [incomingFilters, setIncomingFilters] = useState<Array<Item>>([]);
	const [incomingLoading, setIncomingLoading] = useState(true);
	const [outgoingLoading, setOutgoingLoading] = useState(true);
	const [outgoingFilters, setOutgoingFilters] = useState<Array<Item>>([]);
	const [fetchIncomingFilters, setFetchIncomingFilters] = useState(true);
	const [fetchOutgoingFilters, setFetchOutgoingFilters] = useState(true);

	useEffect(() => {
		if (fetchIncomingFilters) {
			getIncomingFilters()
				.then(({ filterRules }) => {
					setIncomingLoading(false);
					setIncomingFilters(filterRules?.[0]?.filterRule);
					setFetchIncomingFilters(false);
				})
				.catch((error) => {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					createSnackbar({
						key: `share`,
						replace: true,
						hideButton: true,
						type: 'error',
						label:
							error?.message ||
							t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 5000
					});
					setIncomingLoading(false);
					setFetchIncomingFilters(false);
				});
		}
	}, [dispatch, fetchIncomingFilters, createSnackbar]);

	useEffect(() => {
		if (fetchOutgoingFilters) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			dispatch(getOutgoingFilters()).then((res) => {
				setOutgoingLoading(false);
				setOutgoingFilters(res?.payload?.filterRules?.[0]?.filterRule);
				setFetchOutgoingFilters(false);
			});
		}
	}, [dispatch, fetchOutgoingFilters]);

	const moveUp = useCallback((index, list, listSetter) => {
		const tmp = list.slice();

		if (index === tmp.length - 1) return;
		const index2 = index + 1;
		const itemBelow = tmp[index2];
		tmp[index + 1] = tmp[index];
		tmp[index] = itemBelow;
		listSetter(tmp);
	}, []);

	return (
		<Container crossAlignment="baseline" padding={{ top: 'medium' }}>
			<FilterContext.Provider
				value={{
					incomingFilters,
					incomingLoading,
					setFetchIncomingFilters,
					outgoingFilters,
					outgoingLoading,
					moveUp,
					setIncomingFilters,
					setOutgoingFilters,
					setFetchOutgoingFilters
				}}
			>
				<TabBar
					background="gray5"
					items={tabs}
					selected={selectedFilterType}
					height={60}
					onChange={onChange}
				/>
				<Container crossAlignment="flex-start" padding={{ top: 'small' }}>
					{selectedFilterType === 'incoming-messages' && (
						<IncomingMessageFilterTab selectedFilterType={selectedFilterType} t={t} />
					)}
					{selectedFilterType === 'outgoing-messages' && (
						<OutgoingMessageFilterTab selectedFilterType={selectedFilterType} t={t} />
					)}
				</Container>

				<Padding top="medium" />
				<Divider />
			</FilterContext.Provider>
		</Container>
	);
};

export default FilterTabs;
