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
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { FOLDERS, isTrash } from '@zextras/carbonio-ui-commons';
import { capitalize, noop } from 'lodash';
import { useTranslation } from 'react-i18next';

import {
	FILTER_OPTIONS,
	SORT_ICONS,
	SORTING_DIRECTION,
	SORTING_OPTIONS
} from '../../../../constants';
import { parseMessageSortingOptions } from '../../../../helpers/parseMessageSortingOptions';
import { updateSortAndFilterSettings } from '../../../../helpers/sorting';
import { FilterOption, SortOption } from 'types/sorting';

function getRadioIcon(option: string | undefined, value: string): string {
	return option === value ? 'RadioButtonOn' : 'RadioButtonOff';
}

const useListHeaderDropdownItems = ({ folderId }: { folderId: string }): DropdownItem[] => {
	const [t] = useTranslation();
	const { prefs } = useUserSettings();

	const prefSortOrder = useMemo(
		() => (prefs?.zimbraPrefSortOrder as string) ?? '',
		[prefs?.zimbraPrefSortOrder]
	);

	const { sortDirection, sortType, filterType } = useMemo(
		() => parseMessageSortingOptions(folderId, prefSortOrder),
		[folderId, prefSortOrder]
	);

	const sortingOptions: SortOption[] = useMemo(
		() => [
			SORTING_OPTIONS.date,
			...(isTrash(folderId) ? [SORTING_OPTIONS.changeDate] : []),
			SORTING_OPTIONS.subject,
			folderId === FOLDERS.SENT ? SORTING_OPTIONS.to : SORTING_OPTIONS.from,
			SORTING_OPTIONS.size
		],
		[folderId]
	);

	const filteringOptions: FilterOption[] = useMemo(
		() => [
			FILTER_OPTIONS.all,
			FILTER_OPTIONS.unread,
			FILTER_OPTIONS.important,
			FILTER_OPTIONS.flagged,
			FILTER_OPTIONS.attachment
		],
		[]
	);

	const toggleDirectionItem: DropdownItem = useMemo(
		() => ({
			id: 'toggle-direction',
			onClick: (): void => {
				const newDirection =
					sortDirection === SORTING_DIRECTION.ASCENDING
						? SORTING_DIRECTION.DESCENDING
						: SORTING_DIRECTION.ASCENDING;

				updateSortAndFilterSettings({
					folderId,
					prefSortOrder,
					sortType,
					sortDirection: newDirection,
					filter: filterType
				});
			},
			customComponent: (
				<Container
					style={{ minWidth: '160px' }}
					crossAlignment="center"
					mainAlignment="flex-start"
					width="fill"
					orientation="horizontal"
				>
					<Button
						color="gray0"
						onClick={noop}
						type="ghost"
						size="large"
						icon={
							sortDirection === SORTING_DIRECTION.DESCENDING
								? SORT_ICONS.ASCENDING
								: SORT_ICONS.DESCENDING
						}
					/>
					<Text>
						{sortDirection === SORTING_DIRECTION.ASCENDING
							? t('sorting_dropdown.descendingOrder', 'Descending order')
							: t('sorting_dropdown.ascendingOrder', 'Ascending order')}
					</Text>
				</Container>
			)
		}),
		[filterType, sortDirection, sortType, folderId, prefSortOrder, t]
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
			filteringOptions.map(({ value, label }) => {
				const isDefaultFilter = value === undefined;
				const isSelected = (filterType === undefined && isDefaultFilter) || filterType === value;
				const translatedLabel = capitalize(t(`sorting_dropdown.${label}`, label));
				const labelWithDefault = isDefaultFilter
					? `${translatedLabel} (${t('sorting_dropdown.default', 'Default')})`
					: translatedLabel;

				return {
					id: `filter-${value ?? 'all'}`,
					label: labelWithDefault,
					selected: isSelected,
					onClick: (): void => {
						updateSortAndFilterSettings({
							folderId,
							prefSortOrder,
							sortType,
							sortDirection,
							filter: value
						});
					},
					icon: getRadioIcon(isSelected ? 'selected' : 'not-selected', 'selected')
				};
			}),
		[filterType, sortDirection, sortType, filteringOptions, folderId, prefSortOrder, t]
	);

	const sortItems: DropdownItem[] = useMemo(
		() =>
			sortingOptions.map(({ value, label }) => {
				const isTrashFolder = isTrash(folderId);
				const isDefaultSort =
					(isTrashFolder && value === 'changeDate') || (!isTrashFolder && value === 'date');
				const translatedLabel = capitalize(t(`sorting_dropdown.${label}`, label));
				const labelWithDefault = isDefaultSort
					? `${translatedLabel} (${t('sorting_dropdown.default', 'Default')})`
					: translatedLabel;

				return {
					id: `sort-${value}`,
					label: labelWithDefault,
					selected: sortType === value,
					onClick: (): void => {
						updateSortAndFilterSettings({
							folderId,
							prefSortOrder,
							sortType: value,
							sortDirection,
							filter: filterType
						});
					},
					icon: getRadioIcon(sortType, value)
				};
			}),
		[filterType, sortDirection, sortType, folderId, prefSortOrder, sortingOptions, t]
	);

	const sortLabelItem: DropdownItem = useMemo(
		() => ({
			id: 'sort-label',
			disabled: true,
			customComponent: <Text size="medium">{t('sorting_dropdown.sort_by', 'Sort by:')}</Text>
		}),
		[t]
	);

	return useMemo(
		() => [
			toggleDirectionItem,
			{ id: 'divider-1', type: 'divider' },
			sortLabelItem,
			...sortItems,
			{ id: 'divider-2', type: 'divider' },
			filterLabelItem,
			...filterItems
		],
		[filterItems, filterLabelItem, sortItems, sortLabelItem, toggleDirectionItem]
	);
};

export const SortAndFilterButtonComponent = ({
	folderId
}: {
	folderId: string;
}): React.JSX.Element => {
	const [t] = useTranslation();
	const { prefs } = useUserSettings();

	const prefSortOrder = useMemo(
		() => (prefs?.zimbraPrefSortOrder as string) ?? '',
		[prefs?.zimbraPrefSortOrder]
	);

	const { sortDirection } = useMemo(
		() => parseMessageSortingOptions(folderId, prefSortOrder),
		[folderId, prefSortOrder]
	);

	const buttonIcon =
		sortDirection === SORTING_DIRECTION.ASCENDING ? SORT_ICONS.ASCENDING : SORT_ICONS.DESCENDING;

	const dropdownItems = useListHeaderDropdownItems({
		folderId
	});

	return (
		<Tooltip
			label={t('label.change_filtering_sorting_options', 'Change filtering and sorting options')}
			placement="top"
		>
			<Dropdown
				maxHeight={'100vh'}
				disableAutoFocus
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
