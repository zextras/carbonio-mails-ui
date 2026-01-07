/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { PropsWithChildren } from 'react';

import { Breadcrumbs } from 'views/app/folder-panel/parts/breadcrumbs';
import { MultipleSelectionActionsPanel } from 'views/app/folder-panel/parts/multiple-selection-actions-panel';

type SearchConversationListHeaderProps = {
	itemIds: Array<string>;
	selectedItems: Set<string>;
	deselectAll: () => void;
	isSelectModeOn: boolean;
	setIsSelectModeOn: (value: boolean | ((prev: boolean) => boolean)) => void;
	selectAll: () => void;
	isAllSelected: boolean;
	selectAllModeOff: () => void;
};
export const SearchListHeader = ({
	itemIds,
	selectedItems,
	deselectAll,
	isSelectModeOn,
	setIsSelectModeOn,
	selectAll,
	isAllSelected,
	selectAllModeOff,
	children
}: PropsWithChildren<SearchConversationListHeaderProps>): React.JSX.Element => {
	const totalItems = itemIds.length;

	if (isSelectModeOn && totalItems > 0)
		return (
			<MultipleSelectionActionsPanel
				itemsIds={itemIds}
				folderId={''}
				selectedIds={Array.from(selectedItems)}
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
