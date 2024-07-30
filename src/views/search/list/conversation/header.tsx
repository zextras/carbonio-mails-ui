/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { useParams } from 'react-router-dom';

import { useFolder, useRoot } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { useSelection } from '../../../../hooks/use-selection';
import { NormalizedConversation } from '../../../../types';
import { MultipleSelectionActionsPanel } from '../../../../ui-actions/multiple-selection-actions-panel';
import { getFolderParentId } from '../../../../ui-actions/utils';
import { Breadcrumbs } from '../../../app/folder-panel/parts/breadcrumbs';
import { getFolderPath } from '../../../app/folder-panel/parts/utils/utils';

type SearchConversationListHeaderProps = {
	conversations: NormalizedConversation[];
	count: number;
	setCount: (value: number | ((prevState: number) => number)) => void;
	items: Array<{ id: string }>;
};
export const SearchConversationListHeader = ({
	conversations,
	count,
	setCount,
	items
}: SearchConversationListHeaderProps): React.JSX.Element => {
	const { folderId } = useParams<{ folderId: string }>();
	const parentId = getFolderParentId({ folderId, isConversation: true, items });
	const folder = useFolder(parentId);
	const root = useRoot(parentId);
	const folderPath = useMemo(() => getFolderPath(folder, root, true), [folder, root]);
	const totalConversations = conversations.length;

	const {
		selected,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff
	} = useSelection({
		setCount,
		count,
		items
	});

	const selectedIds = useMemo(() => Object.keys(selected), [selected]);

	return isSelectModeOn ? (
		<MultipleSelectionActionsPanel
			items={conversations}
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
			folderPath={folderPath}
			itemsCount={totalConversations}
			isSelectModeOn={isSelectModeOn}
			setIsSelectModeOn={setIsSelectModeOn}
			folderId={folderId}
			isSearchModule
		/>
	);
};
