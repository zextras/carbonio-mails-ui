/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Dropdown, DropdownItem, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { t, useUserSettings, useAppContext, replaceHistory } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { getTooltipLabel } from './utils/utils';
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { SORTING_DIRECTION, SORTING_OPTIONS, SORT_ICONS } from '../../../../constants';
import { parseMessageSortingOptions, updateSortingSettings } from '../../../../helpers/sorting';
import { useAppDispatch } from '../../../../hooks/redux';
import { search } from '../../../../store/actions';
import { AppContext } from '../../../../types';

export const SortingComponent: FC<{ folderId?: string }> = ({ folderId }) => {
	const buttonRef = useRef<HTMLDivElement>(null);
	const { prefs } = useUserSettings();

	const prefSortOrder = useMemo(
		() => prefs?.zimbraPrefSortOrder,
		[prefs?.zimbraPrefSortOrder]
	) as string;
	const { sortType, sortDirection } = parseMessageSortingOptions(folderId, prefSortOrder);

	const dispatch = useAppDispatch();
	const [sortDirectionState, setSortDirectionState] = useState(sortDirection);

	const iconButtonIconProps = useMemo(
		() =>
			sortDirectionState === SORTING_DIRECTION.ASCENDING
				? SORT_ICONS.ASCENDING
				: SORT_ICONS.DESCENDING,
		[sortDirectionState]
	);
	const [sortingTypeState, setSortingTypeState] = useState(sortType);
	useEffect(() => {
		setSortDirectionState(sortDirection);
		setSortingTypeState(sortType);
	}, [sortDirection, sortType]);

	const tooltipLabel = useMemo(
		() => getTooltipLabel(sortingTypeState, sortDirectionState),
		[sortDirectionState, sortingTypeState]
	);

	const { isMessageView } = useAppContext<AppContext>();
	const performSearch = useCallback(
		(sortBy: string): void => {
			dispatch(
				search({
					folderId,
					limit: 100,
					sortBy,
					types: isMessageView ? 'message' : 'conversation'
				})
			);
		},
		[dispatch, folderId, isMessageView]
	);

	const switchAscendingOrDescendingOrder = useCallback(() => {
		setSortDirectionState((prev) =>
			prev === SORTING_DIRECTION.ASCENDING
				? SORTING_DIRECTION.DESCENDING
				: SORTING_DIRECTION.ASCENDING
		);
		const newSortDirection =
			sortDirectionState === SORTING_DIRECTION.ASCENDING
				? SORTING_DIRECTION.DESCENDING
				: SORTING_DIRECTION.ASCENDING;
		const sortBy = `${sortingTypeState}${newSortDirection}`;
		performSearch(sortBy);
		updateSortingSettings({
			prefSortOrder,
			sortingTypeValue: sortingTypeState,
			sortingDirection: newSortDirection,
			folderId
		});

		replaceHistory(`/folder/${folderId}`);
	}, [folderId, performSearch, prefSortOrder, sortDirectionState, sortingTypeState]);

	const selectSortingType = useCallback(
		(sortingTypeValue: string) => {
			setSortingTypeState(sortingTypeValue);
			performSearch(`${sortingTypeValue}${sortDirectionState}`);
			updateSortingSettings({
				prefSortOrder,
				sortingTypeValue,
				sortingDirection: sortDirectionState,
				folderId
			});

			replaceHistory(`/folder/${folderId}`);
		},
		[folderId, performSearch, prefSortOrder, sortDirectionState]
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
				sortDirectionState === SORTING_DIRECTION.ASCENDING
					? t('sorting_dropdown.descendingOrder', 'Descending order')
					: t('sorting_dropdown.ascendingOrder', 'Ascending order'),
			onClick: switchAscendingOrDescendingOrder,
			icon:
				sortDirectionState === SORTING_DIRECTION.DESCENDING
					? SORT_ICONS.ASCENDING
					: SORT_ICONS.DESCENDING
		},
		{
			id: `${SORTING_OPTIONS.unread.value}-id`,
			label: t('sorting_dropdown.unread', 'Unread'),
			selected: sortingTypeState === SORTING_OPTIONS.unread.value,
			onClick: sortUnread,
			icon: sortingTypeState === SORTING_OPTIONS.unread.value ? 'RadioButtonOn' : 'RadioButtonOff'
		},
		{
			id: `${SORTING_OPTIONS.important.value}-id`,
			label: t('sorting_dropdown.important', 'Important'),
			selected: sortingTypeState === SORTING_OPTIONS.important.value,
			onClick: sortImportant,
			icon:
				sortingTypeState === SORTING_OPTIONS.important.value ? 'RadioButtonOn' : 'RadioButtonOff'
		},
		{
			id: `${SORTING_OPTIONS.flagged.value}-id`,
			label: t('sorting_dropdown.flagged', 'Flagged'),
			selected: sortingTypeState === SORTING_OPTIONS.flagged.value,
			onClick: sortFlagged,
			icon: sortingTypeState === SORTING_OPTIONS.flagged.value ? 'RadioButtonOn' : 'RadioButtonOff'
		},
		{
			id: `${SORTING_OPTIONS.attachment.value}-id`,
			label: t('sorting_dropdown.attachment', 'Attachment'),
			selected: sortingTypeState === SORTING_OPTIONS.attachment.value,
			onClick: sortAttachment,
			icon:
				sortingTypeState === SORTING_OPTIONS.attachment.value ? 'RadioButtonOn' : 'RadioButtonOff'
		},
		...(folderId !== FOLDERS.SENT
			? [
					{
						id: `${SORTING_OPTIONS.from.value}-id`,
						label: t('sorting_dropdown.from', 'From'),
						selected: sortingTypeState === SORTING_OPTIONS.from.value,
						onClick: sortFrom,
						icon:
							sortingTypeState === SORTING_OPTIONS.from.value ? 'RadioButtonOn' : 'RadioButtonOff'
					}
				]
			: []),
		...(folderId === FOLDERS.SENT
			? [
					{
						id: `${SORTING_OPTIONS.to.value}-id`,
						label: t('sorting_dropdown.to', 'To'),
						selected: sortingTypeState === SORTING_OPTIONS.to.value,
						onClick: sortTo,
						icon: sortingTypeState === SORTING_OPTIONS.to.value ? 'RadioButtonOn' : 'RadioButtonOff'
					}
				]
			: []),
		{
			id: `${SORTING_OPTIONS.date.value}-id`,
			label: t('sorting_dropdown.date', 'Date'),
			selected: sortingTypeState === SORTING_OPTIONS.date.value,
			onClick: sortDate,
			icon: sortingTypeState === SORTING_OPTIONS.date.value ? 'RadioButtonOn' : 'RadioButtonOff'
		},
		{
			id: `${SORTING_OPTIONS.subject.value}-id`,
			label: t('sorting_dropdown.subject', 'Subject'),
			selected: sortingTypeState === SORTING_OPTIONS.subject.value,
			onClick: sortSubject,
			icon: sortingTypeState === SORTING_OPTIONS.subject.value ? 'RadioButtonOn' : 'RadioButtonOff'
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
