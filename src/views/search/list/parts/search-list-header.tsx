/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { PropsWithChildren, useMemo } from 'react';

import { Breadcrumbs } from 'views/app/folder-panel/parts/breadcrumbs';
import { MultipleSelectionActionsPanel } from 'views/app/folder-panel/parts/multiple-selection-actions-panel';

type SearchConversationListHeaderProps = {
	itemIds: Array<string>;
	selected: Record<string, boolean>;
	deselectAll: () => void;
	isSelectModeOn: boolean;
	setIsSelectModeOn: (value: boolean | ((prev: boolean) => boolean)) => void;
	selectAll: () => void;
	isAllSelected: boolean;
	selectAllModeOff: () => void;
};
export const SearchListHeader = ({
	itemIds,
	selected,
	deselectAll,
	isSelectModeOn,
	setIsSelectModeOn,
	selectAll,
	isAllSelected,
	selectAllModeOff,
	children
}: PropsWithChildren<SearchConversationListHeaderProps>): React.JSX.Element => {
	const totalItems = itemIds.length;

	const selectedIds = useMemo(() => Object.keys(selected), [selected]);

	if (isSelectModeOn && totalItems > 0)
		return (
			<MultipleSelectionActionsPanel
				itemsIds={itemIds}
				folderId={''}
				selectedIds={selectedIds}
				deselectAll={deselectAll}
				selectAll={selectAll}
				isAllSelected={isAllSelected}
				selectAllModeOff={selectAllModeOff}
				setIsSelectModeOn={setIsSelectModeOn}
			>
				{children}
			</MultipleSelectionActionsPanel>
		);
	if (totalItems > 0)
		return (
			<Breadcrumbs
				folderPath={''}
				itemsCount={totalItems}
				isSelectModeOn={isSelectModeOn}
				setIsSelectModeOn={setIsSelectModeOn}
				folderId={''}
				isSearchModule
			/>
		);
	return <></>;
};
