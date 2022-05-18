/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { map, reduce, find } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Container, List, Padding, Shimmer, Text } from '@zextras/carbonio-design-system';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { FOLDERS, useAppContext, useFolder } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';
import { selectConversationStatus, selectFolder } from '../../../store/conversations-slice';
import MessageListItem from './lists-item/message-list-item';
import SelectMessagesPanelActions from '../../../ui-actions/select-panel-action-message';
import { Breadcrumbs } from './breadcrumbs';
import { search } from '../../../store/actions';
import { useSelection } from '../../../hooks/useSelection';
import { useMessageList } from '../../../hooks/use-message-list';
import { selectFolderMsgSearchStatus } from '../../../store/messages-slice';
import ShimmerList from '../../search/shimmer-list';

const DragImageContainer = styled.div`
	position: absolute;
	top: -5000px;
	left: -5000px;
	transform: translate(-100%, -100%);
	width: 35vw;
`;

const DragItems = ({ messages, draggedIds }) => {
	const items = reduce(
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
				<MessageListItem item={item} key={item.id} draggedIds={draggedIds} />
			))}
		</>
	);
};

const MessageList = () => {
	const history = useHistory();
	const activeFolder = history?.location?.pathname?.split?.('/')?.[3];
	const { itemId, folderId } = useParams();
	const folder = useFolder(activeFolder);
	const dispatch = useDispatch();
	const { setCount } = useAppContext();
	const [isDragging, setIsDragging] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [draggedIds, setDraggedIds] = useState();
	const dragImageRef = useRef(null);
	const status = useSelector(selectConversationStatus);
	const { selected, isSelecting, toggle, deselectAll } = useSelection(folderId, setCount);
	const messages = useMessageList();
	const [t] = useTranslation();

	const messageListStatus = useSelector(selectFolderMsgSearchStatus(folderId));

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
		[hasMore, isLoading, dispatch, folderId]
	);

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
	}, [t, messages, folderId]);

	useEffect(() => {
		setDraggedIds(selected);
	}, [selected]);

	return (
		<>
			{isSelecting ? (
				<SelectMessagesPanelActions
					messages={messages}
					selectedIds={selected}
					folderId={folderId}
					deselectAll={deselectAll}
				/>
			) : (
				<Breadcrumbs folderPath={folder?.path} itemsCount={folder?.itemsCount} />
			)}
			{messageListStatus === 'complete' ? (
				<>
					{messages?.length > 0 ? (
						<List
							style={{ paddingBottom: '4px' }}
							selected={selected}
							active={itemId}
							items={messages}
							itemProps={{
								toggle,
								folderId,
								setDraggedIds,
								setIsDragging,
								selectedItems: selected,
								dragImageRef
							}}
							ItemComponent={MessageListItem}
							onListBottom={() => loadMore(messages?.[messages.length - 1]?.date)}
							data-testid={`message-list-${folderId}`}
						/>
					) : (
						<Container>
							<Padding top="medium">
								<Text
									color="gray1"
									overflow="break-word"
									size="small"
									style={{ whiteSpace: 'pre-line', textAlign: 'center', paddingTop: '32px' }}
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
