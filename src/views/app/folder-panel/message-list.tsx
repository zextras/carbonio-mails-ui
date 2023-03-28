/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { FOLDERS, t, useAppContext, useFolder } from '@zextras/carbonio-shell-ui';
import { find, map, noop, reduce } from 'lodash';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { CustomList } from '../../../carbonio-ui-commons/components/list/list';
import { CustomListItem } from '../../../carbonio-ui-commons/components/list/list-item';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useMessageList } from '../../../hooks/use-message-list';
import { useSelection } from '../../../hooks/useSelection';
import { search } from '../../../store/actions';
import { selectConversationStatus } from '../../../store/conversations-slice';
import { selectFolderMsgSearchStatus } from '../../../store/messages-slice';
import { AppContext, IncompleteMessage, MessageListItemProps } from '../../../types';
import SelectMessagesPanelActions from '../../../ui-actions/select-panel-action-message';
import ShimmerList from '../../search/shimmer-list';
import { Breadcrumbs } from './breadcrumbs';
import { MessageListItem } from './lists-item/message-list-item';

const DragImageContainer = styled.div`
	position: absolute;
	top: -312.5rem;
	left: -312.5rem;
	transform: translate(-100%, -100%);
	width: 35vw;
`;

const DragItems: FC<{
	messages: IncompleteMessage[];
	draggedIds: Record<string, boolean>;
}> = ({ messages, draggedIds }) => {
	const items = reduce<typeof draggedIds, MessageListItemProps['item'][]>(
		draggedIds,
		(acc, v, k) => {
			const obj = find(messages, ['id', k]);
			if (obj) {
				return [...acc, obj];
			}
			return acc;
		},
		[]
	);

	return (
		<>
			{map(items, (item) => (
				<MessageListItem
					item={item}
					key={item.id}
					draggedIds={draggedIds}
					folderId={''}
					isConvChildren={false}
					selected={false}
					selectedItems={{}}
					selecting={false}
					setDraggedIds={noop}
					setIsDragging={noop}
					visible={false}
				/>
			))}
		</>
	);
};

const MessageList: FC = () => {
	const history = useHistory();
	const activeFolder = history?.location?.pathname?.split?.('/')?.[3];
	const { itemId, folderId } = useParams<{ itemId: string; folderId: string }>();
	const folder = useFolder(activeFolder);
	const dispatch = useAppDispatch();
	const { setCount, count } = useAppContext<AppContext>();
	const [isDragging, setIsDragging] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [draggedIds, setDraggedIds] = useState<Record<string, boolean>>({});
	const dragImageRef = useRef(null);
	const status = useAppSelector(selectConversationStatus);
	const messages = useMessageList();
	const {
		selected,
		toggle,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff
	} = useSelection(folderId, setCount, count, messages);

	const listRef = useRef<HTMLDivElement>(null);
	const messageListStatus = useAppSelector(selectFolderMsgSearchStatus(folderId));

	const hasMore = useMemo(() => status === 'hasMore', [status]);
	const loadMore = useCallback(
		(date) => {
			if (hasMore && !isLoading) {
				setIsLoading(true);
				const dateOrNull = date ? new Date(date) : null;
				dispatch(search({ folderId, before: dateOrNull, limit: 50, types: 'message' })).then(() => {
					setIsLoading(false);
				});
			}
		},
		[isLoading, hasMore, dispatch, folderId]
	);

	useEffect(() => {
		if (
			listRef.current &&
			listRef.current.children[0] &&
			listRef.current.children[0].scrollTop !== 0
		) {
			listRef.current.children[0].scrollTop = 0;
		}
	}, [folderId]);

	const displayerTitle = useMemo(() => {
		if (messages?.length === 0) {
			if (folderId === FOLDERS.SPAM) {
				return t('displayer.list_spam_title', 'There are no spam e-mails');
			}
			if (folderId === FOLDERS.SENT) {
				return t('displayer.list_sent_title', 'You haven’t sent any e-mail yet');
			}
			if (folderId === FOLDERS.DRAFTS) {
				return t('displayer.list_draft_title', 'There are no saved drafts');
			}
			if (folderId === FOLDERS.TRASH) {
				return t('displayer.list_trash_title', 'The trash is empty');
			}
			return t('displayer.list_folder_title', 'It looks like there are no e-mails yet');
		}
		return null;
	}, [messages, folderId]);

	useEffect(() => {
		setDraggedIds(selected);
	}, [selected]);

	const listItems = useMemo(
		() =>
			map(messages, (message) => {
				const isSelected = selected[message.id];
				const isActive = itemId === message.id;
				return (
					<CustomListItem
						key={message.id}
						selected={isSelected}
						active={isActive}
						background={message.read ? 'gray6' : 'gray5'}
					>
						{(isVisible: boolean): JSX.Element => (
							<MessageListItem
								item={message}
								folderId={folderId}
								selected={isSelected}
								selecting={isSelectModeOn}
								draggedIds={draggedIds}
								setDraggedIds={setDraggedIds}
								setIsDragging={setIsDragging}
								selectedItems={selected}
								visible={isVisible}
								isConvChildren={false}
								toggle={toggle}
								dragImageRef={dragImageRef}
								active={isActive}
							/>
						)}
					</CustomListItem>
				);
			}),
		[draggedIds, folderId, isSelectModeOn, itemId, messages, selected, toggle]
	);

	return (
		<>
			{isSelectModeOn ? (
				<SelectMessagesPanelActions
					messages={messages}
					selectedIds={selected}
					folderId={folderId}
					deselectAll={deselectAll}
					selectAll={selectAll}
					isAllSelected={isAllSelected}
					selectAllModeOff={selectAllModeOff}
				/>
			) : (
				<Breadcrumbs
					folderId={folderId}
					folderPath={folder?.absFolderPath}
					itemsCount={folder?.itemsCount}
					isSelectModeOn={isSelectModeOn}
					setIsSelectModeOn={setIsSelectModeOn}
				/>
			)}
			{messageListStatus === 'complete' ? (
				<>
					{messages?.length > 0 ? (
						<CustomList
							onListBottom={(): void => {
								loadMore(messages?.[messages.length - 1]?.date);
							}}
							data-testid={`message-list-${folderId}`}
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
					<DragImageContainer ref={dragImageRef}>
						{isDragging && <DragItems messages={messages} draggedIds={draggedIds} />}
					</DragImageContainer>
				</>
			) : (
				<ShimmerList count={folder?.itemsCount} />
			)}
		</>
	);
};
export default MessageList;
