/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import {
	Button,
	Container,
	Divider,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { isTrash } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { SORTING_DIRECTION, SORTING_OPTIONS, FILTER_OPTIONS } from '../../../../constants';
import { parseMessageSortingOptions } from '../../../../helpers/parseMessageSortingOptions';
import {
	getTranslatedSortFilterLabel,
	updateSortAndFilterSettings
} from '../../../../helpers/sorting';
import { FilterOption, SortAndFilterState, SortOption } from 'types/sorting';

const isValid = (
	val: string | undefined,
	options: Record<string, SortOption | FilterOption>
): boolean => !!val && Object.values(options).some((opt) => opt.value === val);

const getDefaultSortAndFilterState = (folderId: string): SortAndFilterState => {
	const isTrashFolder = isTrash(folderId);

	return {
		sortType: isTrashFolder ? SORTING_OPTIONS.changeDate.value : SORTING_OPTIONS.date.value,
		sortDirection: SORTING_DIRECTION.DESCENDING,
		filterType: undefined
	};
};

export const SortAndFilterHeaderComponent = ({
	folderId
}: {
	folderId: string;
}): React.JSX.Element | null => {
	const [t] = useTranslation();
	const { prefs } = useUserSettings();

	const prefSortOrder = useMemo(
		() => (prefs?.zimbraPrefSortOrder as string) ?? '',
		[prefs?.zimbraPrefSortOrder]
	);

	const { sortType: rawSortType, filterType: rawFilterType } = useMemo(
		() => parseMessageSortingOptions(folderId, prefSortOrder),
		[folderId, prefSortOrder]
	);

	const defaultSortAndFilterState = getDefaultSortAndFilterState(folderId);

	const sortType = useMemo(
		() =>
			isValid(rawSortType, SORTING_OPTIONS) ? rawSortType : defaultSortAndFilterState.sortType,
		[rawSortType, defaultSortAndFilterState.sortType]
	);

	const filterType = useMemo(
		() =>
			isValid(rawFilterType, FILTER_OPTIONS) ? rawFilterType : defaultSortAndFilterState.filterType,
		[rawFilterType, defaultSortAndFilterState.filterType]
	);

	const resetToDefaultState = useCallback(() => {
		updateSortAndFilterSettings({
			folderId,
			prefSortOrder,
			sortType: defaultSortAndFilterState.sortType,
			sortDirection: defaultSortAndFilterState.sortDirection,
			filter: defaultSortAndFilterState.filterType
		});
	}, [
		defaultSortAndFilterState.sortDirection,
		defaultSortAndFilterState.filterType,
		defaultSortAndFilterState.sortType,
		folderId,
		prefSortOrder
	]);

	const hasModifiedState = useMemo(
		() =>
			sortType !== defaultSortAndFilterState.sortType ||
			filterType !== defaultSortAndFilterState.filterType,
		[sortType, filterType, defaultSortAndFilterState]
	);

	const currentFilterLabel = filterType
		? `${t('label.show', 'Show')}: ${getTranslatedSortFilterLabel(filterType, t)}`
		: '';

	const currentSortLabel = `${t('label.sort_by', 'Sort by')}: ${getTranslatedSortFilterLabel(sortType, t)}`;

	if (!hasModifiedState) return null;
	return (
		<Container
			background="gray5"
			mainAlignment="flex-center"
			crossAlignment="flex-end"
			data-testid="sorting-options-container"
			height="auto"
		>
			<Divider />
			<Row
				padding={{ all: 'small' }}
				width="fill"
				mainAlignment="space-between"
				crossAlignment="center"
			>
				<Text
					size="medium"
					color="gray1"
					overflow="ellipsis"
					style={{
						flex: 1,
						minWidth: 0
					}}
				>
					<>
						{currentSortLabel}
						{currentSortLabel && currentFilterLabel && ' - '}
						{currentFilterLabel}
					</>
				</Text>
				<Padding right="medium" />
				<Tooltip
					placement="top"
					label={t('label.reset_sort_and_filter_to_default', 'Reset to default')}
				>
					<Button
						type="ghost"
						size="medium"
						label={t('label.reset', 'Reset')}
						onClick={resetToDefaultState}
					></Button>
				</Tooltip>
			</Row>
		</Container>
	);
};
