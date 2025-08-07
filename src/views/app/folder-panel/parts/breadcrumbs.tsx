/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
	Button,
	Container,
	Divider,
	Dropdown,
	DropdownItem,
	IconCheckbox,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { TFunction } from 'i18next';
import { capitalize, noop } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { AppContext } from 'app-utils/app-context-initializer';
import { MAILS_ROUTE, SORTING_DIRECTION, SORTING_OPTIONS, SORT_ICONS } from 'constants/index';
import { getFolderPathForBreadcrumb } from 'helpers/folders';
import { parseMessageSortingOptions, undateSortAndFilteringSettings } from 'helpers/sorting';
import { searchEmailStoreAction } from 'store/emails/actions/search-action';
import { LayoutComponent } from 'views/app/folder-panel/parts/layout-component';

const SelectIconCheckbox = styled(IconCheckbox)`
	svg {
		color: ${(props): string => props.theme.palette.primary.regular};
	}
`;

type SortingOption = {
	value: string;
	label: string;
};

type SortDirection = 'Asc' | 'Desc';

const getTranslatedLabelFromValue = (
	value: string | null | undefined,
	t: TFunction<'translation', undefined, 'translation'>
): string => {
	if (!value) return '';
	const option = Object.values(SORTING_OPTIONS).find((opt) => opt.value === value);
	if (!option) return value;
	return t(`sorting_dropdown.${option.label}`, option.label);
};

function getRadioIcon(option: string | undefined, value: string): string {
	return option === value ? 'RadioButtonOn' : 'RadioButtonOff';
}

function IsSearchNeeded(
	currentSortDirection: string,
	sortDirection: string,
	currentSortType: string,
	sortType: string,
	currentFilter: string | undefined,
	filterType: string | undefined
): boolean {
	return (
		currentSortDirection !== sortDirection ||
		currentSortType !== sortType ||
		currentFilter !== filterType
	);
}

export const Breadcrumbs: FC<{
	itemsCount: number;
	isSelectModeOn: boolean;
	setIsSelectModeOn: (ev: boolean | ((prevState: boolean) => boolean)) => void;
	folderPath: string;
	folderId: string;
	isSearchModule?: boolean;
}> = ({ itemsCount, isSelectModeOn, setIsSelectModeOn, folderPath, folderId, isSearchModule }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { folderPathFirstPart, folderPathLastPart } = getFolderPathForBreadcrumb(folderPath);
	const { isMessageView } = useAppContext<AppContext>();
	const { prefs } = useUserSettings();

	const prefSortOrder = useMemo(
		() => (prefs?.zimbraPrefSortOrder as string) ?? '',
		[prefs?.zimbraPrefSortOrder]
	);

	const resetDefaultState = useMemo(
		() => ({
			type: SORTING_OPTIONS.date.value,
			direction: SORTING_DIRECTION.DESCENDING,
			filter: undefined
		}),
		[]
	);

	const { sortDirection, sortType, filterType } = parseMessageSortingOptions(
		folderId,
		prefSortOrder
	);

	const [currentSortType, setCurrentSortType] = useState(sortType);
	const [currentSortDirection, setCurrentSortDirection] = useState(sortDirection);
	const [currentFilter, setCurrentFilter] = useState<string | undefined>(filterType);

	const sortingOptions: SortingOption[] = [
		SORTING_OPTIONS.date,
		SORTING_OPTIONS.subject,
		folderId === FOLDERS.SENT ? SORTING_OPTIONS.to : SORTING_OPTIONS.from
	];

	const filteringOptions: SortingOption[] = [
		SORTING_OPTIONS.unread,
		SORTING_OPTIONS.important,
		SORTING_OPTIONS.flagged,
		SORTING_OPTIONS.attachment
	];

	const getFilterQuery = useCallback(
		(filter: string | null): string => {
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
		},
		[folderId]
	);

	useEffect(() => {
		IsSearchNeeded(
			currentSortDirection,
			sortDirection,
			currentSortType,
			sortType,
			currentFilter,
			filterType
		) &&
			undateSortAndFilteringSettings({
				folderId,
				prefSortOrder,
				sortType: currentSortType,
				sortDirection: currentSortDirection,
				filter: currentFilter
			});
	}, [
		currentFilter,
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
			filterType
		) &&
			searchEmailStoreAction({
				limit: 100,
				sortBy: `${currentSortType}${currentSortDirection}`,
				query: currentFilter ? `${getFilterQuery(currentFilter)}` : `inId:"${folderId}"`,
				types: isMessageView ? 'message' : 'conversation'
			});
	}, [
		currentFilter,
		currentSortDirection,
		currentSortType,
		filterType,
		folderId,
		getFilterQuery,
		isMessageView,
		sortDirection,
		sortType
	]);

	const handleSortChange = useCallback(
		(type: string, direction: SortDirection) => {
			setCurrentSortType(type);
			setCurrentSortDirection(direction);
			navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
		},
		[folderId, navigate]
	);

	const handleFilterChange = useCallback(
		(filter: string): void => {
			setCurrentFilter(filter);
			navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
		},
		[folderId, navigate]
	);

	const toggleDirection = useCallback(() => {
		const newDirection =
			currentSortDirection === SORTING_DIRECTION.ASCENDING
				? SORTING_DIRECTION.DESCENDING
				: SORTING_DIRECTION.ASCENDING;

		handleSortChange(currentSortType, newDirection);
	}, [currentSortDirection, currentSortType, handleSortChange]);

	const resetSearch = useCallback(() => {
		setCurrentFilter(undefined);
		setCurrentSortType(resetDefaultState.type);
		setCurrentSortDirection(resetDefaultState.direction);
	}, [resetDefaultState]);

	// needs to be updated to the new logic
	const hasModifiedState = useMemo(
		() =>
			currentSortType !== resetDefaultState.type ||
			currentSortDirection !== resetDefaultState.direction ||
			currentFilter !== null,
		[currentSortType, currentSortDirection, currentFilter, resetDefaultState]
	);

	const iconButtonIcon =
		currentSortDirection === SORTING_DIRECTION.ASCENDING
			? SORT_ICONS.ASCENDING
			: SORT_ICONS.DESCENDING;

	const isAscending = currentSortDirection === SORTING_DIRECTION.ASCENDING;
	const toggleLabel = isAscending
		? t('sorting_dropdown.descendingOrder', 'Descending order')
		: t('sorting_dropdown.ascendingOrder', 'Ascending order');

	const toggleIcon =
		currentSortDirection === SORTING_DIRECTION.DESCENDING
			? SORT_ICONS.ASCENDING
			: SORT_ICONS.DESCENDING;

	const toggleDirectionItem: DropdownItem = {
		id: 'toggle-direction',
		onClick: toggleDirection,
		customComponent: (
			<Container
				style={{ minWidth: '160px' }}
				crossAlignment="center"
				mainAlignment="space-between"
				width="fill"
				orientation="horizontal"
			>
				<Button color="gray0" onClick={noop} type="ghost" size="large" icon={toggleIcon} />
				<Text>{toggleLabel}</Text>
			</Container>
		)
	};

	const filterLabelItem: DropdownItem = {
		id: 'filter-label',
		disabled: true,
		customComponent: <Text size="medium">{t('sorting_dropdown.show', 'Show:')}</Text>
	};

	const filterItems: DropdownItem[] = filteringOptions.map(({ value, label }) => ({
		id: `filter-${value}`,
		label: capitalize(t(`sorting_dropdown.${value}`, label)),
		selected: currentFilter === value,
		onClick: () => handleFilterChange(value),
		icon: getRadioIcon(currentFilter, value)
	}));

	const sortLabelItem: DropdownItem = {
		id: 'sort-label',
		disabled: true,
		customComponent: <Text size="medium">{t('sorting_dropdown.sort_by', 'Sort by:')}</Text>
	};

	const sortItems: DropdownItem[] = sortingOptions.map(({ value, label }) => ({
		id: `sort-${value}`,
		label: capitalize(t(`sorting_dropdown.${value}`, label)),
		selected: currentSortType === value,
		onClick: () => handleSortChange(value, currentSortDirection),
		icon: getRadioIcon(currentSortType, value)
	}));

	const dropdownItems: DropdownItem[] = [
		toggleDirectionItem,
		{ id: 'divider-1', type: 'divider' },
		filterLabelItem,
		...filterItems,
		{ id: 'divider-2', type: 'divider' },
		sortLabelItem,
		...sortItems
	];

	const activeShowFilter = useMemo(
		() =>
			currentFilter
				? `${t('label.show', 'Show')}: ${getTranslatedLabelFromValue(currentFilter, t)} - `
				: '',
		[currentFilter, t]
	);

	const currentSortFilter = useMemo(
		() => `${t('label.sort_by', 'Sort by')}: ${getTranslatedLabelFromValue(currentSortType, t)}`,
		[currentSortType, t]
	);

	return (
		<>
			<Container
				background="gray5"
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				height="3rem"
				data-testid="breadcrumbs-component"
			>
				<Row
					height="100%"
					width="fill"
					padding={{ all: 'extrasmall' }}
					mainAlignment="space-between"
					wrap="nowrap"
				>
					<Row
						mainAlignment="flex-start"
						padding={{ right: 'medium' }}
						takeAvailableSpace
						wrap="nowrap"
					>
						<Tooltip
							label={t('label.activate_selection_mode', 'Activate selection mode')}
							maxWidth="100%"
						>
							<SelectIconCheckbox
								data-testid="select-icon-checkbox"
								borderRadius="regular"
								icon="CheckmarkSquare"
								defaultChecked={isSelectModeOn}
								size="regular"
								onChange={noop}
								onClick={(): void => setIsSelectModeOn((prev) => !prev)}
							/>
						</Tooltip>
						{folderPathFirstPart?.trim()?.length > 0 && (
							<Text
								size="medium"
								style={{ marginLeft: '0.5rem' }}
								data-testid="BreadcrumbPathStart"
								color="gray1"
							>
								{folderPathFirstPart}
							</Text>
						)}
						<Text size="medium" style={{ marginLeft: '0.5rem' }} data-testid="BreadcrumbPathEnd">
							{folderPathLastPart}
						</Text>
					</Row>
					<Row>
						<Text size="extrasmall" data-testid="BreadcrumbCount">
							{itemsCount}
						</Text>
						<Padding right="large" />
						{!isSearchModule && (
							<>
								<LayoutComponent />
								<Tooltip
									label={t(
										'label.change_filtering_sorting_options',
										'Change filtering and sorting options'
									)}
									placement="top"
								>
									<Dropdown
										items={dropdownItems}
										multiple
										itemPaddingBetween="large"
										itemIconSize="large"
										selectedBackgroundColor="highlight"
										data-testid="sorting-dropdown"
									>
										<Button
											type="ghost"
											icon={iconButtonIcon}
											color="gray0"
											size="large"
											onClick={noop}
										/>
									</Dropdown>
								</Tooltip>
							</>
						)}
					</Row>
				</Row>
			</Container>

			{hasModifiedState && (
				<Container
					background="gray5"
					mainAlignment="flex-center"
					crossAlignment="flex-end"
					height="3rem"
					data-testid="sorting-options-container"
				>
					<Divider />
					<Row padding={{ all: 'small' }}>
						<Text size="medium" color="gray1">
							{`${activeShowFilter}${currentSortFilter}`}
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
								onClick={resetSearch}
							/>
						</Tooltip>
					</Row>
				</Container>
			)}
		</>
	);
};
