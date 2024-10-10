/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useContext, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import type { TFunction } from 'i18next';
import { filter, map } from 'lodash';

import { FilterContext } from './filter-context';
import FilterItem from './filter-item';
import IncomingFilterActions from './incoming-filters-actions';
import LoadingShimmer from './loading-shimmer';
import { useFilterSelection } from './use-filter-selection';
import { modifyFilterRules } from '../../../../store/actions/modify-filter-rules';
import Heading from '../../components/settings-heading';
import { ListOld } from '../../list-old';

type ComponentProps = {
	t: TFunction;
	selectedFilterType: string;
};

const IncomingMsgFilterTab: FC<ComponentProps> = ({ t, selectedFilterType }): ReactElement => {
	const { incomingFilters, incomingLoading, setFetchIncomingFilters } = useContext(FilterContext);

	const incomingFiltersCopy = useMemo(() => incomingFilters?.slice(), [incomingFilters]);
	const [active, available] = useMemo(
		() => [
			map(filter(incomingFiltersCopy, { active: true }), (f) => ({ ...f, id: f.name })),
			map(filter(incomingFiltersCopy, { active: false }), (f) => ({ ...f, id: f.name }))
		],
		[incomingFiltersCopy]
	);

	const activeList = useFilterSelection(
		active,
		setFetchIncomingFilters,
		modifyFilterRules,
		available
	);

	const availableList = useFilterSelection(
		available,
		setFetchIncomingFilters,
		modifyFilterRules,
		active
	);

	const actionButtonsProps = useMemo(
		() => ({
			t,
			availableList,
			activeList,
			selectedFilterType,
			incomingFilters: incomingFiltersCopy,
			setFetchIncomingFilters
		}),
		[t, availableList, activeList, selectedFilterType, incomingFiltersCopy, setFetchIncomingFilters]
	);

	return (
		<Container crossAlignment="flex-start" mainAlignment="flex-start" orientation="horizontal">
			<Container width="43%" minHeight="30vh" mainAlignment="flex-start">
				<Heading title={t('filters.active_filters', 'Active Filters')} size="small" />
				<Container>
					{incomingLoading ? (
						<LoadingShimmer />
					) : (
						<ListOld
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
			<Container width="14%" padding={{ all: 'large' }} mainAlignment="space-between">
				<IncomingFilterActions compProps={actionButtonsProps} />
			</Container>
			<Container width="43%" mainAlignment="flex-start">
				<Heading title={t('filters.available_filters', 'Available Filters')} size="small" />

				<Container>
					{incomingLoading ? (
						<LoadingShimmer />
					) : (
						<ListOld
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

export default IncomingMsgFilterTab;
