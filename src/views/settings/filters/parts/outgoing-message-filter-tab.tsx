/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo, useContext } from 'react';
import { List, Container } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import { filter, map } from 'lodash';
import FilterItem from './filter-item';
import { useFilterSelection } from './use-filter-selection';
import Heading from '../../components/settings-heading';
import LoadingShimmer from './loading-shimmer';
import { FilterContext } from './filter-context';
import { modifyOutgoingFilterRules } from '../../../../store/actions/modify-filter-rules';
import OutgoingFilterActions from './outgoing-filters-actions';

type ComponentProps = {
	t: TFunction;
	selectedFilterType: string;
};
const OutgoingMsgFilterTab: FC<ComponentProps> = ({ t, selectedFilterType }): ReactElement => {
	const { outgoingFilters, outgoingLoading, setFetchOutgoingFilters } = useContext(FilterContext);
	const outgoingFiltersCopy = useMemo(() => outgoingFilters?.slice(), [outgoingFilters]);

	const [active, available] = useMemo(
		() => [
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			map(filter(outgoingFiltersCopy, { active: true }), (f) => ({ ...f, id: f.name })),
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			map(filter(outgoingFiltersCopy, { active: false }), (f) => ({ ...f, id: f.name }))
		],
		[outgoingFiltersCopy]
	);
	const activeList = useFilterSelection(
		active,
		setFetchOutgoingFilters,
		modifyOutgoingFilterRules,
		available
	);
	const availableList = useFilterSelection(
		available,
		setFetchOutgoingFilters,
		modifyOutgoingFilterRules,
		active
	);

	const actionButtonsProps = useMemo(
		() => ({
			t,
			availableList,
			activeList,
			selectedFilterType,
			outgoingFilters: outgoingFiltersCopy,
			setFetchOutgoingFilters
		}),
		[t, availableList, activeList, selectedFilterType, outgoingFiltersCopy, setFetchOutgoingFilters]
	);
	return (
		<Container crossAlignment="flex-start" mainAlignment="flex-start" orientation="horizontal">
			<Container width="43%" minHeight="30vh" mainAlignment="flex-start">
				<Heading title={t('filters.active_filters', 'Active Filters')} size="small" />
				<Container>
					{outgoingLoading ? (
						<LoadingShimmer />
					) : (
						<List
							items={activeList.list}
							selected={activeList.selected}
							ItemComponent={FilterItem}
							itemProps={{
								listProps: activeList,
								unSelect: availableList.unSelect
							}}
						/>
					)}
				</Container>
			</Container>
			<Container width="14%" padding="large" mainAlignment="space-between">
				<OutgoingFilterActions compProps={actionButtonsProps} />
			</Container>
			<Container width="43%" mainAlignment="flex-start">
				<Heading title={t('filters.available_filters', 'Available Filters')} size="small" />
				<Container>
					{outgoingLoading ? (
						<LoadingShimmer />
					) : (
						<List
							items={availableList.list}
							selected={availableList.selected}
							ItemComponent={FilterItem}
							itemProps={{
								listProps: availableList,
								unSelect: activeList.unSelect
							}}
						/>
					)}
				</Container>
			</Container>
		</Container>
	);
};
export default OutgoingMsgFilterTab;
