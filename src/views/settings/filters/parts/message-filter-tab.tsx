/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';

import { Container, useSnackbar } from '@zextras/carbonio-design-system';
import { filter, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { FilterList } from './filter-list';
import { FilterManagerProps } from './filter-manager';
import LoadingShimmer from './loading-shimmer';
import { useFilterSelection } from './use-filter-selection';
import { FilterRulesAPIResponse } from '../../../../api/get-filters';
import { Filter } from '../../../../types';
import Heading from '../../components/settings-heading';

type MessageFilterProps = {
	getFilters: () => Promise<FilterRulesAPIResponse>;
	saveFilters: (filters: Array<Filter>) => Promise<void>;
	FiltersManagerComponent: (props: FilterManagerProps) => React.JSX.Element;
};
export const MessageFilterTab = ({
	getFilters,
	saveFilters,
	FiltersManagerComponent
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
	const fetchFilters = useCallback(() => {
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
						error?.message || t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 5000
				});
			});
	}, [createSnackbar, getFilters, t]);

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
		fetchFilters();
	}, [fetchFilters]);

	const activeListSelection = useFilterSelection(activeFilters, modifyFilter, availableFilters);
	const availableListSelection = useFilterSelection(availableFilters, modifyFilter, activeFilters);

	return (
		<Container crossAlignment="flex-start" mainAlignment="flex-start" orientation="horizontal">
			<Container width="43%" minHeight="30vh" mainAlignment="flex-start">
				<Heading title={t('filters.active_filters', 'Active Filters')} size="small" />
				<Container>
					{loading ? (
						<LoadingShimmer />
					) : (
						<FilterList
							filters={activeListSelection.list}
							selected={activeListSelection.selected}
							unSelect={availableListSelection.unSelect}
							moveDown={activeListSelection.moveDown}
							moveUp={activeListSelection.moveUp}
							toggle={activeListSelection.toggle}
						/>
					)}
				</Container>
			</Container>
			<Container width="14%" padding={{ all: 'large' }} mainAlignment="space-between">
				<FiltersManagerComponent
					filters={filters}
					activeList={activeListSelection}
					onFiltersSave={modifyFilter}
					availableList={availableListSelection}
				/>
			</Container>
			<Container width="43%" mainAlignment="flex-start">
				<Heading title={t('filters.available_filters', 'Available Filters')} size="small" />
				<Container>
					{loading ? (
						<LoadingShimmer />
					) : (
						<FilterList
							filters={availableListSelection.list}
							selected={availableListSelection.selected}
							unSelect={activeListSelection.unSelect}
							moveDown={availableListSelection.moveDown}
							moveUp={availableListSelection.moveUp}
							toggle={availableListSelection.toggle}
						/>
					)}
				</Container>
			</Container>
		</Container>
	);
};
