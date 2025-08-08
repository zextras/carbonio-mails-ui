/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import {
	Button,
	Container,
	Dropdown,
	DropdownItem,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { capitalize, noop } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { MAILS_ROUTE, SORT_ICONS, SORTING_DIRECTION, SORTING_OPTIONS } from '../../../../constants';

type SortingOption = {
	value: string;
	label: string;
};

function getRadioIcon(option: string | undefined, value: string): string {
	return option === value ? 'RadioButtonOn' : 'RadioButtonOff';
}

const useListHeaderDropdownItems = ({
	folderId,
	currentSortDirection,
	setCurrentSortDirection,
	currentFilter,
	setCurrentFilter,
	currentSortType,
	setCurrentSortType
}: {
	folderId: string;
	currentSortDirection: 'Asc' | 'Desc';
	setCurrentSortDirection: React.Dispatch<React.SetStateAction<'Asc' | 'Desc'>>;
	currentFilter: string | undefined;
	setCurrentFilter: React.Dispatch<React.SetStateAction<string | undefined>>;
	currentSortType: string;
	setCurrentSortType: React.Dispatch<React.SetStateAction<string>>;
}): DropdownItem[] => {
	const navigate = useNavigate();
	const [t] = useTranslation();

	const sortingOptions: SortingOption[] = useMemo(
		() => [
			SORTING_OPTIONS.date,
			SORTING_OPTIONS.subject,
			folderId === FOLDERS.SENT ? SORTING_OPTIONS.to : SORTING_OPTIONS.from
		],
		[folderId]
	);

	const filteringOptions: SortingOption[] = useMemo(
		() => [
			SORTING_OPTIONS.unread,
			SORTING_OPTIONS.important,
			SORTING_OPTIONS.flagged,
			SORTING_OPTIONS.attachment
		],
		[]
	);

	const toggleDirectionItem: DropdownItem = useMemo(
		() => ({
			id: 'toggle-direction',
			onClick: (): void => {
				const newDirection =
					currentSortDirection === SORTING_DIRECTION.ASCENDING
						? SORTING_DIRECTION.DESCENDING
						: SORTING_DIRECTION.ASCENDING;

				setCurrentSortDirection(newDirection);
				navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
			},
			customComponent: (
				<Container
					style={{ minWidth: '160px' }}
					crossAlignment="center"
					mainAlignment="space-between"
					width="fill"
					orientation="horizontal"
				>
					<Button
						color="gray0"
						onClick={noop}
						type="ghost"
						size="large"
						icon={
							currentSortDirection === SORTING_DIRECTION.DESCENDING
								? SORT_ICONS.ASCENDING
								: SORT_ICONS.DESCENDING
						}
					/>
					<Text>
						{currentSortDirection === SORTING_DIRECTION.ASCENDING
							? t('sorting_dropdown.descendingOrder', 'Descending order')
							: t('sorting_dropdown.ascendingOrder', 'Ascending order')}
					</Text>
				</Container>
			)
		}),
		[currentSortDirection, folderId, navigate, setCurrentSortDirection, t]
	);

	const filterLabelItem: DropdownItem = useMemo(
		() => ({
			id: 'filter-label',
			disabled: true,
			customComponent: <Text size="medium">{t('sorting_dropdown.show', 'Show:')}</Text>
		}),
		[t]
	);

	const filterItems: DropdownItem[] = useMemo(
		() =>
			filteringOptions.map(({ value, label }) => ({
				id: `filter-${value}`,
				label: capitalize(t(`sorting_dropdown.${value}`, label)),
				selected: currentFilter === value,
				onClick: (): void => {
					setCurrentFilter(value);
					navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
				},
				icon: getRadioIcon(currentFilter, value)
			})),
		[currentFilter, filteringOptions, folderId, navigate, setCurrentFilter, t]
	);

	const sortLabelItem: DropdownItem = useMemo(
		() => ({
			id: 'sort-label',
			disabled: true,
			customComponent: <Text size="medium">{t('sorting_dropdown.sort_by', 'Sort by:')}</Text>
		}),
		[t]
	);

	const sortItems: DropdownItem[] = useMemo(
		() =>
			sortingOptions.map(({ value, label }) => ({
				id: `sort-${value}`,
				label: capitalize(t(`sorting_dropdown.${value}`, label)),
				selected: currentSortType === value,
				onClick: (): void => {
					setCurrentSortType(value);
					navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
				},
				icon: getRadioIcon(currentSortType, value)
			})),
		[currentSortType, folderId, navigate, setCurrentSortType, sortingOptions, t]
	);
	return useMemo(
		() => [
			toggleDirectionItem,
			{ id: 'divider-1', type: 'divider' },
			filterLabelItem,
			...filterItems,
			{ id: 'divider-2', type: 'divider' },
			sortLabelItem,
			...sortItems
		],
		[filterItems, filterLabelItem, sortItems, sortLabelItem, toggleDirectionItem]
	);
};

export const SortAndFilterButtonComponent = ({
	folderId,
	currentSortDirection,
	setCurrentSortDirection,
	currentFilter,
	setCurrentFilter,
	currentSortType,
	setCurrentSortType
}: {
	folderId: string;
	currentSortDirection: 'Asc' | 'Desc';
	setCurrentSortDirection: React.Dispatch<React.SetStateAction<'Asc' | 'Desc'>>;
	currentFilter: string | undefined;
	setCurrentFilter: React.Dispatch<React.SetStateAction<string | undefined>>;
	currentSortType: string;
	setCurrentSortType: React.Dispatch<React.SetStateAction<string>>;
}): React.JSX.Element => {
	const [t] = useTranslation();

	const buttonIcon =
		currentSortDirection === SORTING_DIRECTION.ASCENDING
			? SORT_ICONS.ASCENDING
			: SORT_ICONS.DESCENDING;

	const dropdownItems = useListHeaderDropdownItems({
		folderId,
		currentSortDirection,
		currentSortType,
		currentFilter,
		setCurrentSortType,
		setCurrentFilter,
		setCurrentSortDirection
	});

	return (
		<Tooltip
			label={t('label.change_filtering_sorting_options', 'Change filtering and sorting options')}
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
				<Button type="ghost" icon={buttonIcon} color="gray0" size="large" onClick={noop} />
			</Dropdown>
		</Tooltip>
	);
};
