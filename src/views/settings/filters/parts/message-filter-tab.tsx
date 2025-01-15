/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useEffect, useMemo, useState } from 'react';

import { Container, useSnackbar } from '@zextras/carbonio-design-system';
import { filter, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { FilterActionProps } from './filter-actions';
import { FilterList } from './filter-list';
import LoadingShimmer from './loading-shimmer';
import { useFilterSelection } from './use-filter-selection';
import { FilterRulesAPIResponse } from '../../../../api/get-filters';
import { modifyOutgoingFilterRules } from '../../../../store/actions/modify-filter-rules';
import { Filter } from '../../../../types';
import Heading from '../../components/settings-heading';

type MessageFilterProps = {
	getFilters: () => Promise<FilterRulesAPIResponse>;
	FilterActionsComponent: (props: FilterActionProps) => React.JSX.Element;
};
export const MessageFilterTab: FC<MessageFilterProps> = ({
	getFilters,
	FilterActionsComponent
}): ReactElement => {
	const [filters, setFilters] = useState<Array<Filter>>([]);
	const [loading, setLoading] = useState(true);
	const [fetchFilters, setFetchFilters] = useState(true);
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const filtersCopy = useMemo(() => filters.slice(), [filters]);
	const [activeFilters, availableFilters] = useMemo(
		() => [
			map(filter(filtersCopy, { active: true }), (f) => ({ ...f, id: f.name })),
			map(filter(filtersCopy, { active: false }), (f) => ({ ...f, id: f.name }))
		],
		[filtersCopy]
	);

	const activeList = useFilterSelection(
		activeFilters,
		setFetchFilters,
		modifyOutgoingFilterRules,
		availableFilters
	);
	const availableList = useFilterSelection(
		availableFilters,
		setFetchFilters,
		modifyOutgoingFilterRules,
		activeFilters
	);
	useEffect(() => {
		getFilters()
			.then(({ filterRules }) => {
				setLoading(false);
				setFilters(filterRules?.[0]?.filterRule ?? []);
				setFetchFilters(false);
			})
			.catch((error) => {
				createSnackbar({
					key: `share`,
					replace: true,
					hideButton: true,
					severity: 'error',
					label:
						error?.message || t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 5000
				});
				setLoading(false);
				setFetchFilters(false);
			});
	}, [createSnackbar, fetchFilters, getFilters, t]);

	return (
		<Container crossAlignment="flex-start" mainAlignment="flex-start" orientation="horizontal">
			<Container width="43%" minHeight="30vh" mainAlignment="flex-start">
				<Heading title={t('filters.active_filters', 'Active Filters')} size="small" />
				<Container>
					{loading ? (
						<LoadingShimmer />
					) : (
						<FilterList
							filters={activeList.list}
							selected={activeList.selected}
							unSelect={availableList.unSelect}
							moveDown={activeList.moveDown}
							moveUp={activeList.moveUp}
							toggle={activeList.toggle}
						/>
					)}
				</Container>
			</Container>
			<Container width="14%" padding={{ all: 'large' }} mainAlignment="space-between">
				<FilterActionsComponent
					filters={filters}
					setFilters={setFilters}
					setFetchFilters={setFetchFilters}
					activeList={activeList}
					availableList={availableList}
				/>
			</Container>
			<Container width="43%" mainAlignment="flex-start">
				<Heading title={t('filters.available_filters', 'Available Filters')} size="small" />
				<Container>
					{loading ? (
						<LoadingShimmer />
					) : (
						<FilterList
							filters={availableList.list}
							selected={availableList.selected}
							unSelect={activeList.unSelect}
							moveDown={availableList.moveDown}
							moveUp={availableList.moveUp}
							toggle={availableList.toggle}
						/>
					)}
				</Container>
			</Container>
		</Container>
	);
};
