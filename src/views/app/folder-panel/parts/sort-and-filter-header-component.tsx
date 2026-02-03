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
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { SORTING_DIRECTION, SORTING_OPTIONS, FILTER_OPTIONS } from '../../../../constants';
import {
	parseMessageSortingOptions,
	updateSortAndFilterSettings
} from '../../../../helpers/sorting';
import type { SortOption, FilterOption, SortAndFilterState } from '../../../../types';

/**
 * Translates a sort or filter option value to its localized label
 *
 * This function looks up the corresponding sorting or filtering option by its value
 * and returns the translated label. Spaces in label keys are converted to underscores
 * for translation key lookup (e.g., "last modified" becomes "sorting_dropdown.last_modified").
 *
 * @param value - The value of the sort/filter option (e.g., 'date', 'changeDate', 'read')
 * @param t - The i18next translation function
 * @returns The translated label for the option, or the original value if no match is found
 *
 * @example
 * // For sort option with value 'changeDate'
 * getTranslatedSortFilterLabel('changeDate', t)
 * // Returns: t('sorting_dropdown.last_modified', 'last modified')
 */
const getTranslatedSortFilterLabel = (
	value: string | null | undefined,
	t: TFunction<'translation', undefined, 'translation'>
): string => {
	if (!value) return '';
	const sortOpt = Object.values(SORTING_OPTIONS).find((opt) => opt.value === value);
	if (sortOpt) {
		const translationKey = sortOpt.label.replace(/ /g, '_');
		return t(`sorting_dropdown.${translationKey}`, sortOpt.label);
	}
	const filterOpt = Object.values(FILTER_OPTIONS).find((opt) => opt.value === value);
	if (filterOpt) {
		const translationKey = filterOpt.label.replace(/ /g, '_');
		return t(`sorting_dropdown.${translationKey}`, filterOpt.label);
	}
	return value;
};

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

	const defaultSortAndFilterState = useMemo<SortAndFilterState>(
		() => getDefaultSortAndFilterState(folderId),
		[folderId]
	);

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

	const currentFilterLabel = useMemo(
		() =>
			filterType
				? `${t('label.show', 'Show')}: ${getTranslatedSortFilterLabel(filterType, t)}`
				: '',
		[filterType, t]
	);

	const currentSortLabel = useMemo(
		() => `${t('label.sort_by', 'Sort by')}: ${getTranslatedSortFilterLabel(sortType, t)}`,
		[sortType, t]
	);

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
