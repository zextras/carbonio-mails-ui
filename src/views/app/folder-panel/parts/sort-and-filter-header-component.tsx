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
	Icon,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { SORTING_DIRECTION, SORTING_OPTIONS } from '../../../../constants';
import {
	parseMessageSortingOptions,
	updateSortAndFilterSettings
} from '../../../../helpers/sorting';

const getTranslatedLabelFromValue = (
	value: string | null | undefined,
	t: TFunction<'translation', undefined, 'translation'>
): string => {
	if (!value) return '';
	const option = Object.values(SORTING_OPTIONS).find((opt) => opt.value === value);
	if (!option) return value;
	return t(`sorting_dropdown.${option.label}`, option.label);
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

	const { sortType, filterType } = useMemo(
		() => parseMessageSortingOptions(folderId, prefSortOrder),
		[folderId, prefSortOrder]
	);
	const defaultState = useMemo(
		() => ({
			type: SORTING_OPTIONS.date.value,
			direction: SORTING_DIRECTION.DESCENDING,
			filter: undefined
		}),
		[]
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
			filterType
				? `${t('label.show', 'Show')}: ${getTranslatedLabelFromValue(filterType, t)} - `
				: '',
		[filterType, t]
	);

	const currentSortLabel = useMemo(
		() => `${t('label.sort_by', 'Sort by')}: ${getTranslatedLabelFromValue(sortType, t)}`,
		[sortType, t]
	);

	if (!hasModifiedState) return null;
	return (
		<Container
			background={'gray5'}
			mainAlignment="flex-center"
			crossAlignment="flex-end"
			height="3rem"
			data-testid="sorting-options-container"
		>
			<Divider />
			<Row padding={{ all: 'small' }}>
				<Text size="medium" color="gray1" overflow="ellipsis">
					{`${currentFilterLabel}${currentSortLabel}`}
				</Text>
				<Padding right="medium" />
				<Tooltip
					placement="top"
					label={t('label.reset_to_sort_by_date', 'Reset to “Sort by: Date”')}
				>
					<Button
						type="ghost"
						size="medium"
						onClick={resetToDefaultState}
						icon="CloseOutline"
						shape="regular"
						color="gray0"
					></Button>
				</Tooltip>
			</Row>
		</Container>
	);
};
