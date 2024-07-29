/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, memo, useMemo } from 'react';

import { Container, Divider, Padding, Text } from '@zextras/carbonio-design-system';
import { noop } from 'lodash';

import { CustomList } from '../../../../carbonio-ui-commons/components/list/list';
import { useFolder, useRoot } from '../../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { NormalizedConversation } from '../../../../types';
import { MultipleSelectionActionsPanel } from '../../../../ui-actions/multiple-selection-actions-panel';
import { Breadcrumbs } from '../../../app/folder-panel/parts/breadcrumbs';
import { getFolderPath } from '../../../app/folder-panel/parts/utils/utils';
import ShimmerList from '../../shimmer-list';

export type SearchConversationListComponentProps = {
	// the text to display in the side panel
	displayerTitle: string | null;
	// the list of conversations to display
	listItems: React.JSX.Element[];
	// the function to call when the list is scrolled to the bottom
	loadMore?: () => void;
	// the total number of conversations in the list
	totalConversations: number;
	// true if the call has been fulfilled
	conversationsLoadingCompleted: boolean;
	// the ids of the selected conversations
	selectedIds: string[];
	// the id of the current folder
	folderId: string;
	// the conversations to display
	conversations: Array<NormalizedConversation>;
	// true if the component is in the search module
	isSearchModule?: boolean;
	// true if the user is in select mode
	isSelectModeOn: boolean;
	// the selected conversations
	selected: Record<string, boolean>;
	// the function to call when the user deselects all conversations
	deselectAll: () => void;
	// the function to call when the user selects all conversations
	selectAll: () => void;
	// true if all conversations are selected
	isAllSelected: boolean;
	// the function to call when the user deselects all conversations
	selectAllModeOff: () => void;
	// the function to call when the user toggles select mode
	setIsSelectModeOn: (ev: boolean | ((prevState: boolean) => boolean)) => void;
	listRef?: React.RefObject<HTMLDivElement>;
	hasMore?: boolean;
};

export const SearchConversationListComponent: FC<SearchConversationListComponentProps> = memo(
	function ConversationListComponent({
		displayerTitle,
		isSearchModule,
		isSelectModeOn,
		folderId,
		conversations,
		selected,
		deselectAll,
		selectAll,
		isAllSelected,
		selectAllModeOff,
		setIsSelectModeOn,
		conversationsLoadingCompleted,
		loadMore = noop,
		listItems,
		totalConversations,
		listRef,
		hasMore
	}) {
		const folder = useFolder(folderId);
		const root = useRoot(folder?.id ?? '');

		const folderPath = useMemo(
			() => getFolderPath(folder, root, isSearchModule),
			[root, folder, isSearchModule]
		);

		const showBreadcrumbs = useMemo(
			() =>
				!isSearchModule ||
				typeof isSearchModule === 'undefined' ||
				(isSearchModule && totalConversations > 0),
			[isSearchModule, totalConversations]
		);

		const selectedIds = useMemo(() => Object.keys(selected), [selected]);

		return (
			<>
				{isSelectModeOn ? (
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
					showBreadcrumbs && (
						<Breadcrumbs
							folderPath={folderPath}
							itemsCount={totalConversations}
							isSelectModeOn={isSelectModeOn}
							setIsSelectModeOn={setIsSelectModeOn}
							folderId={folderId}
							isSearchModule={isSearchModule}
						/>
					)
				)}
				{conversationsLoadingCompleted ? (
					<>
						<Divider color="gray2" />
						{totalConversations > 0 || hasMore ? (
							<CustomList
								onListBottom={(): void => {
									loadMore && loadMore();
								}}
								data-testid={`conversation-list-${folderId}`}
								ref={listRef}
							>
								{listItems}
							</CustomList>
						) : (
							<Container>
								<Padding top="medium">
									<Text
										color="gray1"
										overflow="break-word"
										size="small"
										style={{ whiteSpace: 'pre-line', textAlign: 'center', paddingTop: '2rem' }}
									>
										{displayerTitle}
									</Text>
								</Padding>
							</Container>
						)}
					</>
				) : (
					<ShimmerList count={totalConversations} delay={500} />
				)}
			</>
		);
	}
);
