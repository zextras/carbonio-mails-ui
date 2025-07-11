/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

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

import { MAILS_ROUTE, SORTING_DIRECTION, SORTING_OPTIONS, SORT_ICONS } from 'constants/index';
import { getFolderPathForBreadcrumb } from 'helpers/folders';
import { parseMessageSortingOptions } from 'helpers/sorting';
import { searchEmailStoreAction } from 'store/emails/actions/search-action';
import { AppContext } from 'types';
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

function getRadioIcon(activeFilter: string | null, value: string): string {
	return activeFilter === value ? 'RadioButtonOn' : 'RadioButtonOff';
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

	const defaultSortState = useMemo(() => {
		const { sortDirection } = parseMessageSortingOptions(folderId, prefSortOrder);
		return {
			type: SORTING_OPTIONS.date.value as string,
			direction: sortDirection
		};
	}, [folderId, prefSortOrder]);

	const [currentSortType, setCurrentSortType] = useState(defaultSortState.type);
	const [currentSortDirection, setCurrentSortDirection] = useState(defaultSortState.direction);
	const [activeFilter, setActiveFilter] = useState<string | null>(null);

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
		(filter: string): string => {
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
					return '';
			}
		},
		[folderId]
	);

	const performSearch = useCallback(
		(sortBy: string, filter?: string | null) => {
			searchEmailStoreAction({
				limit: 100,
				sortBy,
				query: filter ? `${getFilterQuery(filter)}` : `inId:"${folderId}"`,
				types: isMessageView ? 'message' : 'conversation'
			});
		},
		[folderId, getFilterQuery, isMessageView]
	);

	const handleSortChange = useCallback(
		(type: string, direction: SortDirection, filter: string | null = activeFilter) => {
			const sortBy = `${type}${direction}`;
			setCurrentSortType(type);
			setCurrentSortDirection(direction);
			performSearch(sortBy, filter);
			navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
		},
		[activeFilter, folderId, navigate, performSearch]
	);

	const handleFilterChange = useCallback(
		(filter: string): void => {
			setActiveFilter(filter);
			performSearch(`${currentSortType}${currentSortDirection}`, filter);
			navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
		},
		[currentSortDirection, currentSortType, folderId, navigate, performSearch]
	);

	const toggleDirection = useCallback(() => {
		const newDirection =
			currentSortDirection === SORTING_DIRECTION.ASCENDING
				? SORTING_DIRECTION.DESCENDING
				: SORTING_DIRECTION.ASCENDING;
		handleSortChange(currentSortType, newDirection, activeFilter);
	}, [currentSortDirection, currentSortType, handleSortChange, activeFilter]);

	const resetSearch = useCallback(() => {
		setActiveFilter(null);
		setCurrentSortType(defaultSortState.type);
		setCurrentSortDirection(defaultSortState.direction);
		performSearch(`${defaultSortState.type}${defaultSortState.direction}`, null);
	}, [defaultSortState, performSearch]);

	const hasModifiedState = useMemo(
		() =>
			currentSortType !== defaultSortState.type ||
			currentSortDirection !== defaultSortState.direction ||
			activeFilter !== null,
		[currentSortType, currentSortDirection, activeFilter, defaultSortState]
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
		selected: activeFilter === value,
		onClick: () => handleFilterChange(value),
		icon: getRadioIcon(activeFilter, value)
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
			activeFilter
				? `${t('label.show', 'Show')}: ${getTranslatedLabelFromValue(activeFilter, t)} - `
				: '',
		[activeFilter, t]
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
