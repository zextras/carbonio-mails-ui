/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { Breadcrumbs } from '../../../app/folder-panel/parts/breadcrumbs';
import { MultipleSelectionActionsPanel } from '../../../app/folder-panel/parts/multiple-selection-actions-panel';

type SearchConversationListHeaderProps = {
	itemIds: Set<string>;
	folderId: string;
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
	folderId,
	selected,
	deselectAll,
	isSelectModeOn,
	setIsSelectModeOn,
	selectAll,
	isAllSelected,
	selectAllModeOff
}: SearchConversationListHeaderProps): React.JSX.Element => {
	const totalItems = itemIds.size;

	const selectedIds = useMemo(() => Object.keys(selected), [selected]);

	if (isSelectModeOn && totalItems > 0)
		return (
			<MultipleSelectionActionsPanel
				itemsIds={itemIds}
				folderId={folderId}
				selectedIds={selectedIds}
				deselectAll={deselectAll}
				selectAll={selectAll}
				isAllSelected={isAllSelected}
				selectAllModeOff={selectAllModeOff}
				setIsSelectModeOn={setIsSelectModeOn}
			/>
		);
	if (totalItems > 0)
		return (
			<Breadcrumbs
				folderPath={''}
				itemsCount={totalItems}
				isSelectModeOn={isSelectModeOn}
				setIsSelectModeOn={setIsSelectModeOn}
				folderId={folderId}
				isSearchModule
			/>
		);
	return <></>;
};
