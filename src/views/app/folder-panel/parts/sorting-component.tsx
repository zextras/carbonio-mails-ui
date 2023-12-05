/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useRef, useState } from 'react';

import { Dropdown, DropdownItem, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { FOLDERS, editSettings, t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { find, noop } from 'lodash';

import { SORTING_OPTIONS } from '../../../../constants';
import { useAppDispatch } from '../../../../hooks/redux';

/**
 * Returns the name of the account that owns the given address
 *
 * @param folderId
 * @param zimbraPrefSortOrder
 */
const getSortingForFolder = (folderId?: string, zimbraPrefSortOrder?: string): string => {
	// TODO: Need to refactor this function and also return can be in json object with require values
	if (!zimbraPrefSortOrder || !folderId) {
		return 'dateDesc';
	}
	const sortOrderString = zimbraPrefSortOrder.split(',BDLV')[0];
	const sortingFolders = sortOrderString.split(',');
	const sortOrderOfFolder = find(sortingFolders, (item) => item.split(':')[0] === folderId);
	if (
		!!sortOrderOfFolder &&
		sortOrderOfFolder.split(':').length === 2 &&
		!sortOrderOfFolder.includes(SORTING_OPTIONS.size.value)
	) {
		const sortOrderResult = sortOrderOfFolder.split(':')[1];
		const sort = sortOrderResult.split(/Asc|Desc/i)[0];
		// let order = 'desc';
		// if (/Asc|Desc/i.test(sortOrderResult)) {
		// 	order = sortOrderResult.match(/Asc|Desc/i)[0];
		// }
		return sortOrderResult;
	}
	return 'dateDesc';
};

export const SortingComponent: FC<{ folderId?: string }> = ({ folderId }) => {
	const buttonRef = useRef<HTMLDivElement>(null);
	const { prefs } = useUserSettings();

	const prefSortOrder = useMemo(
		() => prefs?.zimbraPrefSortOrder,
		[prefs?.zimbraPrefSortOrder]
	) as string;

	const prefsSortOrder = getSortingForFolder(folderId, prefSortOrder);
	const dispatch = useAppDispatch();
	const ascendingOrDescending = prefsSortOrder.includes('Desc') ? 'Desc' : 'Asc';
	const [sortingDirection, setSortingDirection] = useState(ascendingOrDescending);
	const iconButtonIconProps = useMemo(
		() => (ascendingOrDescending === 'Asc' ? 'ZaListOutline' : 'AzListOutline'),
		[ascendingOrDescending]
	);
	const [sortingType, setSortingType] = useState(prefsSortOrder.split(/Asc|Desc/i)[0]);

	const tooltipLabel = useMemo(() => 'tooltip', []);
	const switchAscendingOrDescendingOrder = useCallback(() => {
		setSortingDirection((prev) => (prev === 'Asc' ? 'Desc' : 'Asc'));
		// TODO: On change of order we also need to update the pref setting with API call
		// like added on change of sorting type
	}, []);

	const selectSortingType = useCallback(
		(sortingTypeValue) => {
			setSortingType(sortingTypeValue);
			// TODO: Need to make proper function which can provide the new sorting string as per
			// the sorting order and sorting type selection for the folder
			// At the moment creating sortingString here for temparory
			const secondString = prefSortOrder.substring(prefSortOrder.indexOf(',BDLV'));
			const sortingString = `${folderId}:${sortingTypeValue}${sortingDirection}${secondString}`;
			const changes = {
				prefs: {
					zimbraPrefSortOrder: sortingString
				}
			};
			editSettings(changes).then((res) => {
				if (res.type.includes('fulfilled')) {
					noop;
				} else {
					noop;
				}
			});
		},
		[folderId, prefSortOrder, sortingDirection]
	);

	const sortUnread = useCallback(() => {
		selectSortingType(SORTING_OPTIONS.unread.value);
	}, [selectSortingType]);

	const sortTo = useCallback(() => {
		selectSortingType(SORTING_OPTIONS.to.value);
	}, [selectSortingType]);

	const sortFlagged = useCallback(() => {
		selectSortingType(SORTING_OPTIONS.flagged.value);
	}, [selectSortingType]);

	const sortDate = useCallback(() => {
		selectSortingType(SORTING_OPTIONS.date.value);
	}, [selectSortingType]);

	const sortFrom = useCallback(() => {
		selectSortingType(SORTING_OPTIONS.from.value);
	}, [selectSortingType]);

	const sortSubject = useCallback(() => {
		selectSortingType(SORTING_OPTIONS.subject.value);
	}, [selectSortingType]);

	const sortAttachment = useCallback(() => {
		selectSortingType(SORTING_OPTIONS.attachment.value);
	}, [selectSortingType]);

	const sortImportant = useCallback(() => {
		selectSortingType(SORTING_OPTIONS.important.value);
	}, [selectSortingType]);

	const items: Array<DropdownItem> = [
		{
			id: 'activity-1',
			label:
				sortingDirection === 'Asc'
					? t('sorting_dropdown.ascendingOrder', 'Ascending order')
					: t('sorting_dropdown.descendingOrder', 'Descending order'),
			onClick: switchAscendingOrDescendingOrder,
			icon: sortingDirection === 'Asc' ? 'ZaListOutline' : 'AzListOutline'
		},
		{
			id: `${SORTING_OPTIONS.unread.value}-id`,
			label: t('sorting_dropdown.unread', 'Unread'),
			selected: sortingType === SORTING_OPTIONS.unread.value,
			onClick: sortUnread,
			icon: sortingType === SORTING_OPTIONS.unread.value ? 'RadioButtonOn' : 'RadioButtonOff'
		},
		{
			id: `${SORTING_OPTIONS.important.value}-id`,
			label: t('sorting_dropdown.important', 'Important'),
			selected: sortingType === SORTING_OPTIONS.important.value,
			onClick: sortImportant,
			icon: sortingType === SORTING_OPTIONS.important.value ? 'RadioButtonOn' : 'RadioButtonOff'
		},
		{
			id: `${SORTING_OPTIONS.flagged.value}-id`,
			label: t('sorting_dropdown.flagged', 'Flagged'),
			selected: sortingType === SORTING_OPTIONS.flagged.value,
			onClick: sortFlagged,
			icon: sortingType === SORTING_OPTIONS.flagged.value ? 'RadioButtonOn' : 'RadioButtonOff'
		},
		{
			id: `${SORTING_OPTIONS.attachment.value}-id`,
			label: t('sorting_dropdown.attachment', 'Attachment'),
			selected: sortingType === SORTING_OPTIONS.attachment.value,
			onClick: sortAttachment,
			icon: sortingType === SORTING_OPTIONS.attachment.value ? 'RadioButtonOn' : 'RadioButtonOff'
		},
		...(folderId !== FOLDERS.SENT
			? [
					{
						id: `${SORTING_OPTIONS.from.value}-id`,
						label: t('sorting_dropdown.from', 'From'),
						selected: sortingType === SORTING_OPTIONS.from.value,
						onClick: sortFrom,
						icon: sortingType === SORTING_OPTIONS.from.value ? 'RadioButtonOn' : 'RadioButtonOff'
					}
			  ]
			: []),
		...(folderId === FOLDERS.SENT
			? [
					{
						id: `${SORTING_OPTIONS.to.value}-id`,
						label: t('sorting_dropdown.to', 'To'),
						selected: sortingType === SORTING_OPTIONS.to.value,
						onClick: sortTo,
						icon: sortingType === SORTING_OPTIONS.to.value ? 'RadioButtonOn' : 'RadioButtonOff'
					}
			  ]
			: []),
		{
			id: `${SORTING_OPTIONS.date.value}-id`,
			label: t('sorting_dropdown.date', 'Date'),
			selected: sortingType === SORTING_OPTIONS.date.value,
			onClick: sortDate,
			icon: sortingType === SORTING_OPTIONS.date.value ? 'RadioButtonOn' : 'RadioButtonOff'
		},
		{
			id: `${SORTING_OPTIONS.subject.value}-id`,
			label: t('sorting_dropdown.subject', 'Subject'),
			selected: sortingType === SORTING_OPTIONS.subject.value,
			onClick: sortSubject,
			icon: sortingType === SORTING_OPTIONS.subject.value ? 'RadioButtonOn' : 'RadioButtonOff'
		}
	];
	return (
		<Tooltip label={tooltipLabel} placement="top">
			<Dropdown
				items={items}
				multiple
				itemPaddingBetween="large"
				itemIconSize="large"
				selectedBackgroundColor="highlight"
				data-testid="sorting-dropdown"
			>
				<IconButton icon={iconButtonIconProps} size="large" ref={buttonRef} onClick={noop} />
			</Dropdown>
		</Tooltip>
	);
};
