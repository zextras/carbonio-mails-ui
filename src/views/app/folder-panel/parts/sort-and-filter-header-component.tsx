/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
	Button,
	Container,
	Divider,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { AppContext } from '../../../../app-utils/app-context-initializer';
import { SORTING_DIRECTION, SORTING_OPTIONS } from '../../../../constants';
import { updateSortAndFilterSettings } from '../../../../helpers/sorting';
import { searchEmailStoreAction } from '../../../../store/emails/actions/search-action';

const getTranslatedLabelFromValue = (
	value: string | null | undefined,
	t: TFunction<'translation', undefined, 'translation'>
): string => {
	if (!value) return '';
	const option = Object.values(SORTING_OPTIONS).find((opt) => opt.value === value);
	if (!option) return value;
	return t(`sorting_dropdown.${option.label}`, option.label);
};

export const getFilterQuery = (filter: string | undefined, folderId: string): string => {
	if (!filter) return `inId:"${folderId}"`;
	switch (filter) {
		case 'read':
			return `inId:"${folderId}" is:unread`;
		case 'priority':
			return `inId:"${folderId}" priority:high`;
		case 'flag':
			return `inId:"${folderId}" is:flagged`;
		case 'attach':
			return `inId:"${folderId}" has:attachment`;
		default:
			return `inId:"${folderId}"`;
	}
};

function IsSearchNeeded(
	currentSortDirection: string,
	sortDirection: string,
	currentSortType: string,
	sortType: string,
	currentFilter: string | undefined,
	filterType: string | undefined,
	currentFolderId: string | undefined,
	folderId: string
): boolean {
	return (
		(currentSortDirection !== sortDirection ||
			currentSortType !== sortType ||
			currentFilter !== filterType) &&
		currentFolderId === folderId
	);
}

export const SortAndFilterHeaderComponent = ({
	folderId,
	currentSortDirection,
	setCurrentSortDirection,
	currentFilter,
	setCurrentFilter,
	currentSortType,
	setCurrentSortType,
	sortDirection,
	sortType,
	filterType
}: {
	folderId: string;
	currentSortDirection: 'Asc' | 'Desc';
	setCurrentSortDirection: React.Dispatch<React.SetStateAction<'Asc' | 'Desc'>>;
	currentFilter: string | undefined;
	setCurrentFilter: React.Dispatch<React.SetStateAction<string | undefined>>;
	currentSortType: string;
	setCurrentSortType: React.Dispatch<React.SetStateAction<string>>;
	sortDirection: 'Asc' | 'Desc';
	sortType: string;
	filterType: string | undefined;
}): React.JSX.Element | null => {
	const [t] = useTranslation();
	const [currentFolderId, setCurrentFolderId] = useState<string>(folderId);
	const { isMessageView } = useAppContext<AppContext>();

	const prefSortOrder = useUserSettings()?.prefs?.zimbraPrefSortOrder as string;

	const defaultState = useMemo(
		() => ({
			type: SORTING_OPTIONS.date.value,
			direction: SORTING_DIRECTION.DESCENDING,
			filter: undefined
		}),
		[]
	);

	const resetToDefaultState = useCallback(() => {
		setCurrentFilter(defaultState.filter);
		setCurrentSortType(defaultState.type);
		setCurrentSortDirection(defaultState.direction);
	}, [
		defaultState.direction,
		defaultState.filter,
		defaultState.type,
		setCurrentFilter,
		setCurrentSortDirection,
		setCurrentSortType
	]);

	const hasModifiedState = useMemo(
		() => currentSortType !== defaultState.type || currentFilter !== defaultState.filter,
		[currentSortType, currentFilter, defaultState]
	);

	const currentFilterLabel = useMemo(
		() =>
			currentFilter
				? `${t('label.show', 'Show')}: ${getTranslatedLabelFromValue(currentFilter, t)} - `
				: '',
		[currentFilter, t]
	);

	const currentSortLabel = useMemo(
		() => `${t('label.sort_by', 'Sort by')}: ${getTranslatedLabelFromValue(currentSortType, t)}`,
		[currentSortType, t]
	);

	useEffect(() => {
		if (currentFolderId !== folderId) {
			setCurrentFolderId(folderId);
			setCurrentSortType(sortType);
			setCurrentSortDirection(sortDirection);
			setCurrentFilter(filterType);
		}
	}, [
		currentFolderId,
		filterType,
		folderId,
		setCurrentFilter,
		setCurrentSortDirection,
		setCurrentSortType,
		sortDirection,
		sortType
	]);

	useEffect(() => {
		IsSearchNeeded(
			currentSortDirection,
			sortDirection,
			currentSortType,
			sortType,
			currentFilter,
			filterType,
			currentFolderId,
			folderId
		) &&
			updateSortAndFilterSettings({
				folderId,
				prefSortOrder,
				sortType: currentSortType,
				sortDirection: currentSortDirection,
				filter: currentFilter
			});
	}, [
		currentFilter,
		currentFolderId,
		currentSortDirection,
		currentSortType,
		filterType,
		folderId,
		prefSortOrder,
		sortDirection,
		sortType
	]);

	useEffect(() => {
		IsSearchNeeded(
			currentSortDirection,
			sortDirection,
			currentSortType,
			sortType,
			currentFilter,
			filterType,
			currentFolderId,
			folderId
		) &&
			searchEmailStoreAction({
				limit: 100,
				sortBy: `${currentSortType}${currentSortDirection}`,
				query: getFilterQuery(currentFilter, folderId),
				types: isMessageView ? 'message' : 'conversation'
			});
	}, [
		currentFilter,
		currentFolderId,
		currentSortDirection,
		currentSortType,
		filterType,
		folderId,
		isMessageView,
		sortDirection,
		sortType
	]);

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
				<Text size="medium" color="gray1">
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
						label={t('label.reset', 'Reset')}
						onClick={resetToDefaultState}
					/>
				</Tooltip>
			</Row>
		</Container>
	);
};
