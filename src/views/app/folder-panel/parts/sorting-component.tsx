/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Dropdown, DropdownItem, Tooltip, Text } from '@zextras/carbonio-design-system';
import { t, useAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { MAILS_ROUTE, SORTING_DIRECTION, SORTING_OPTIONS, SORT_ICONS } from 'constants/index';
import { isSent } from 'helpers/folders';
import { parseMessageSortingOptions, updateSortingSettings } from 'helpers/sorting';
import { searchEmailStoreAction } from 'store/emails/actions/search-action';
import { AppContext } from 'types/index.d';
import { getTooltipLabel } from 'views/app/folder-panel/parts/utils/utils';

type SortingOption = {
	value: string;
	label: string;
};

type SortDirection = 'Asc' | 'Desc';

export const SortingComponent = ({ folderId }: { folderId: string }): React.JSX.Element => {
	const buttonRef = useRef<HTMLDivElement>(null);
	const { prefs } = useUserSettings();
	const navigate = useNavigate();
	const { isMessageView } = useAppContext<AppContext>();

	const prefSortOrder = useMemo(
		() => (prefs?.zimbraPrefSortOrder as string) ?? '',
		[prefs?.zimbraPrefSortOrder]
	);

	const { sortType, sortDirection } = useMemo(
		() => parseMessageSortingOptions(folderId, prefSortOrder),
		[folderId, prefSortOrder]
	);

	const [sortDirectionState, setSortDirectionState] = useState(sortDirection);
	const [sortingTypeState, setSortingTypeState] = useState(sortType);

	useEffect(() => {
		setSortDirectionState(sortDirection);
		setSortingTypeState(sortType);
	}, [sortDirection, sortType]);

	const tooltipLabel = useMemo(
		() => getTooltipLabel(sortingTypeState, sortDirectionState),
		[sortingTypeState, sortDirectionState]
	);

	const iconButtonIcon =
		sortDirectionState === SORTING_DIRECTION.ASCENDING
			? SORT_ICONS.ASCENDING
			: SORT_ICONS.DESCENDING;

	const performSearch = useCallback(
		(sortBy: string) => {
			searchEmailStoreAction({
				folderId,
				limit: 100,
				sortBy,
				types: isMessageView ? 'message' : 'conversation'
			});
		},
		[folderId, isMessageView]
	);

	const applySort = useCallback(
		(type: string, direction: SortDirection) => {
			const sortBy = `${type}${direction}`;
			setSortingTypeState(type);
			setSortDirectionState(direction);
			performSearch(sortBy);
			updateSortingSettings({
				prefSortOrder,
				sortingTypeValue: type,
				sortingDirection: direction,
				folderId
			});
			navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
		},
		[folderId, navigate, performSearch, prefSortOrder]
	);

	const toggleDirection = useCallback(() => {
		const newDirection =
			sortDirectionState === SORTING_DIRECTION.ASCENDING
				? SORTING_DIRECTION.DESCENDING
				: SORTING_DIRECTION.ASCENDING;
		applySort(sortingTypeState, newDirection);
	}, [sortDirectionState, sortingTypeState, applySort]);

	const handleSortTypeChange = useCallback(
		(type: string) => applySort(type, sortDirectionState),
		[applySort, sortDirectionState]
	);

	const sortingOptions = useMemo(() => {
		const options: SortingOption[] = [
			SORTING_OPTIONS.unread,
			SORTING_OPTIONS.important,
			SORTING_OPTIONS.flagged,
			SORTING_OPTIONS.attachment,
			SORTING_OPTIONS.date,
			SORTING_OPTIONS.subject
		];

		if (isSent(folderId)) {
			options.push(SORTING_OPTIONS.to);
		} else {
			options.push(SORTING_OPTIONS.from);
		}

		return options;
	}, [folderId]);

	const dropdownItems: DropdownItem[] = [
		{
			id: 'toggle-direction',
			label:
				sortDirectionState === SORTING_DIRECTION.ASCENDING
					? t('sorting_dropdown.descendingOrder', 'Descending order')
					: t('sorting_dropdown.ascendingOrder', 'Ascending order'),
			onClick: toggleDirection,
			icon:
				sortDirectionState === SORTING_DIRECTION.DESCENDING
					? SORT_ICONS.ASCENDING
					: SORT_ICONS.DESCENDING
		},
		{
			id: 'divider-1',
			type: 'divider'
		},
		{
			id: 'sort-by-label',
			disabled: true,
			customComponent: <Text size="medium">{t('sorting_dropdown.sort_by', 'Sort by:')}</Text>
		},
		...sortingOptions.map(({ value, label }) => ({
			id: `${value}-id`,
			label: t(`sorting_dropdown.${value}`, label),
			selected: sortingTypeState === value,
			onClick: () => handleSortTypeChange(value),
			icon: sortingTypeState === value ? 'RadioButtonOn' : 'RadioButtonOff'
		}))
	];

	return (
		<Tooltip label={tooltipLabel} placement="top">
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
					ref={buttonRef}
					onClick={noop}
				/>
			</Dropdown>
		</Tooltip>
	);
};
