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
import { FOLDERS } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { useSelection } from '../../hooks/use-selection';
import { BackupSearchesStateType } from '../../store/backup-search-slice';
import type { AppContext } from '../../types';
import { BackupSearchMessageListComponent } from '../app/folder-panel/messages/backup-search-message-list-component';
import { BackupSearchMessageListItem } from '../app/folder-panel/messages/backup-search-message-list-item';

type BackupSearchMessageListProps = {
	backupMessages: BackupSearchesStateType['messages'];
};

export const BackupSearchMessageList = ({
	backupMessages
}: BackupSearchMessageListProps): React.JSX.Element => {
	const { itemId } = useParams<{ itemId: string }>();
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
		currentFolderId: FOLDERS.INBOX,
		setCount,
		count,
		items: [...Object.values(backupMessages ?? {})]
	});

	const listRef = useRef<HTMLDivElement>(null);

	const listItems = useMemo(
		() =>
			map(backupMessages, (message) => {
				const active = itemId === message.id;
				const isSelected = selected[message.id];
				return (
					<CustomListItem
						key={message.id}
						selected={isSelected}
						active={active}
						background={'gray6'}
					>
						{(visible: boolean): ReactElement =>
							visible ? (
								<BackupSearchMessageListItem
									item={message}
									selected={message}
									isSelected={isSelected}
									// active={active}
									// toggle={toggle}
									isSelectModeOn
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
		[itemId, backupMessages, selected]
	);

	// const totalMessages = useMemo(() => {
	// 	if (backupMessages) {
	// 		return Object.keys(backupMessages.messages).length;
	// 	}
	// 	return 0;
	// }, [backupMessages]);
	//
	// const messagesLoadingCompleted = useMemo(
	// 	() => !isArray(backupMessages?.messages),
	// 	[backupMessages?.messages]
	// );
	// const selectedIds = useMemo(() => Object.keys(selected), [selected]);
	// const messages = useMemo(
	// 	() => Object.values(backupMessages?.messages ?? {}),
	// 	[backupMessages?.messages]
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
