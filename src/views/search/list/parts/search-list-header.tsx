/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { MultipleSelectionActionsPanel } from '../../../../ui-actions/multiple-selection-actions-panel';
import { Breadcrumbs } from '../../../app/folder-panel/parts/breadcrumbs';

type SearchConversationListHeaderProps = {
	items: Array<{ id: string }>;
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
	items,
	folderId,
	selected,
	deselectAll,
	isSelectModeOn,
	setIsSelectModeOn,
	selectAll,
	isAllSelected,
	selectAllModeOff
}: SearchConversationListHeaderProps): React.JSX.Element => {
	const totalConversations = items.length;

	const selectedIds = useMemo(() => Object.keys(selected), [selected]);

	return isSelectModeOn ? (
		<MultipleSelectionActionsPanel
			items={items}
			folderId={folderId}
			selectedIds={selectedIds}
			deselectAll={deselectAll}
			selectAll={selectAll}
			isAllSelected={isAllSelected}
			selectAllModeOff={selectAllModeOff}
			setIsSelectModeOn={setIsSelectModeOn}
		/>
	) : (
		<Breadcrumbs
			folderPath={''}
			itemsCount={totalConversations}
			isSelectModeOn={isSelectModeOn}
			setIsSelectModeOn={setIsSelectModeOn}
			folderId={folderId}
			isSearchModule
		/>
	);
};
