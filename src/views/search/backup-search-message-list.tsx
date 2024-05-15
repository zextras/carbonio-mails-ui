/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useMemo, useRef } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { CustomListItem } from '../../carbonio-ui-commons/components/list/list-item';
import { useSelection } from '../../hooks/use-selection';
import { BackupSearchesStateType } from '../../store/backup-search-slice';
import type { AppContext } from '../../types';
import { BackupSearchMessageListComponent } from '../app/folder-panel/messages/backup-search-message-list-component';
import { BackupSearchMessageListItem } from '../app/folder-panel/messages/backup-search-message-list-item';

type BackupSearchMessageListProps = {
	searchResults: BackupSearchesStateType['messages'];
};

export const BackupSearchMessageList = ({
	searchResults
}: BackupSearchMessageListProps): React.JSX.Element => {
	const { itemId, folderId } = useParams<{ itemId: string; folderId: string }>();
	const { setCount, count } = useAppContext<AppContext>();

	const {
		selected,
		toggle,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff
	} = useSelection({
		currentFolderId: folderId,
		setCount,
		count,
		items: [...Object.values(searchResults ?? {})]
	});

	const listRef = useRef<HTMLDivElement>(null);

	const listItems = useMemo(
		() =>
			map(searchResults, (message) => {
				const active = itemId === message.messageId;
				const isSelected = selected[message.messageId];
				return (
					<CustomListItem
						key={message.messageId}
						selected={isSelected}
						active={active}
						background={'gray6'}
					>
						{(visible: boolean): ReactElement =>
							visible ? (
								<BackupSearchMessageListItem
									item={message}
									// selected={message}
									// isSelected={isSelected}
									// active={active}
									// toggle={toggle}
									// isSelectModeOn={isSelectModeOn}
									// isSearchModule
									// deselectAll={deselectAll}
									// visible={visible}
								/>
							) : (
								<div style={{ height: '4rem' }} />
							)
						}
					</CustomListItem>
				);
			}),
		[itemId, searchResults, selected]
	);

	// const totalMessages = useMemo(() => {
	// 	if (searchResults) {
	// 		return Object.keys(searchResults.messages).length;
	// 	}
	// 	return 0;
	// }, [searchResults]);
	//
	// const messagesLoadingCompleted = useMemo(
	// 	() => !isArray(searchResults?.messages),
	// 	[searchResults?.messages]
	// );
	// const selectedIds = useMemo(() => Object.keys(selected), [selected]);
	// const messages = useMemo(
	// 	() => Object.values(searchResults?.messages ?? {}),
	// 	[searchResults?.messages]
	// );

	return (
		<Container
			background="gray6"
			width="25%"
			height="fill"
			mainAlignment="flex-start"
			data-testid="MailsSearchResultListContainer"
		>
			<BackupSearchMessageListComponent
				// totalMessages={totalMessages}
				listItems={listItems}
				// messagesLoadingCompleted={messagesLoadingCompleted}
				// selectedIds={selectedIds}
				// folderId={folderId}
				// messages={messages}
				// isSelectModeOn={isSelectModeOn}
				// setIsSelectModeOn={setIsSelectModeOn}
				// isAllSelected={isAllSelected}
				// selectAll={selectAll}
				// deselectAll={deselectAll}
				// selected={selected}
				// selectAllModeOff={selectAllModeOff}
				// isSearchModule
				// setDraggedIds={noop}
				listRef={listRef}
			/>
		</Container>
	);
};
