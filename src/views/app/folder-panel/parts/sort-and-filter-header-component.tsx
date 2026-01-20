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
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { SORTING_DIRECTION, SORTING_OPTIONS, FILTER_OPTIONS } from '../../../../constants';
import {
	parseMessageSortingOptions,
	updateSortAndFilterSettings
} from '../../../../helpers/sorting';

const getTranslatedLabelFromValue = (
	value: string | null | undefined,
	t: TFunction<'translation', undefined, 'translation'>
): string => {
	if (!value) return '';
	const sortOpt = Object.values(SORTING_OPTIONS).find((opt) => opt.value === value);
	if (sortOpt) return t(`sorting_dropdown.${sortOpt.label}`, sortOpt.label);
	const filterOpt = Object.values(FILTER_OPTIONS).find((opt) => opt.value === value);
	if (filterOpt) return t(`sorting_dropdown.${filterOpt.label}`, filterOpt.label);
	return value;
};

const isValid = (
	val: string | undefined,
	options: Record<string, { value: string | undefined }>
): boolean => !!val && Object.values(options).some((opt) => opt.value === val);

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

	const defaultState = useMemo(
		() => ({
			type: SORTING_OPTIONS.date.value,
			direction: SORTING_DIRECTION.DESCENDING,
			filter: undefined as string | undefined
		}),
		[]
	);

	const sortType = useMemo(
		() => (isValid(rawSortType, SORTING_OPTIONS) ? rawSortType : defaultState.type),
		[rawSortType, defaultState.type]
	);

	const filterType = useMemo(
		() => (isValid(rawFilterType, FILTER_OPTIONS) ? rawFilterType : defaultState.filter),
		[rawFilterType, defaultState.filter]
	);

	const resetToDefaultState = useCallback(() => {
		updateSortAndFilterSettings({
			folderId,
			prefSortOrder,
			sortType: defaultState.type,
			sortDirection: defaultState.direction,
			filter: defaultState.filter
		});
	}, [defaultState.direction, defaultState.filter, defaultState.type, folderId, prefSortOrder]);

	const hasModifiedState = useMemo(
		() => sortType !== defaultState.type || filterType !== defaultState.filter,
		[sortType, filterType, defaultState]
	);

	const currentFilterLabel = useMemo(
		() =>
			filterType ? `${t('label.show', 'Show')}: ${getTranslatedLabelFromValue(filterType, t)}` : '',
		[filterType, t]
	);

	const currentSortLabel = useMemo(
		() => `${t('label.sort_by', 'Sort by')}: ${getTranslatedLabelFromValue(sortType, t)}`,
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
					label={t('label.reset_to_sort_by_date', 'Reset to “Sort by: Date”')}
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
