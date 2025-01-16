/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';

import { Container, useSnackbar } from '@zextras/carbonio-design-system';
import { filter, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { FilterActionProps } from './filter-actions';
import { FilterList } from './filter-list';
import LoadingShimmer from './loading-shimmer';
import { useFilterSelection } from './use-filter-selection';
import { FilterRulesAPIResponse } from '../../../../api/get-filters';
import { Filter } from '../../../../types';
import Heading from '../../components/settings-heading';

type MessageFilterProps = {
	getFilters: () => Promise<FilterRulesAPIResponse>;
	saveFilters: (filters: Array<any>) => Promise<void>;
	FilterActionsComponent: (props: FilterActionProps) => React.JSX.Element;
};
export const MessageFilterTab = ({
	getFilters,
	saveFilters,
	FilterActionsComponent
}: MessageFilterProps): ReactElement => {
	const [filters, setFilters] = useState<Array<Filter>>([]);
	const [loading, setLoading] = useState(true);
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
	const fetchFilters = useCallback(
		() =>
			getFilters()
				.then(({ filterRules }) => {
					setFilters(filterRules?.[0]?.filterRule ?? []);
					setLoading(false);
				})
				.catch((error) => {
					setLoading(false);
					createSnackbar({
						key: `share`,
						replace: true,
						hideButton: true,
						severity: 'error',
						label:
							error?.message ||
							t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 5000
					});
				}),
		[createSnackbar, getFilters, t]
	);

	const modifyFilter = useCallback(
		(newFilters: Array<Filter>) =>
			saveFilters(newFilters)
				.then(fetchFilters)
				.catch(() => {
					createSnackbar({
						key: `share`,
						replace: true,
						hideButton: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 5000
					});
				}),
		[createSnackbar, fetchFilters, saveFilters, t]
	);

	useEffect(() => {
		const _ignored = fetchFilters();
		return () => {};
	}, [fetchFilters]);

	const activeList = useFilterSelection(activeFilters, modifyFilter, availableFilters);
	const availableList = useFilterSelection(availableFilters, modifyFilter, activeFilters);

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
					activeList={activeList}
					onFiltersSave={modifyFilter}
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
