/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Container,
	Divider,
	Padding,
	SnackbarManagerContext,
	Text
} from '@zextras/carbonio-design-system';
import { t, useAppContext, useFolder } from '@zextras/carbonio-shell-ui';
import { find, map, noop, reduce } from 'lodash';
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { CustomList } from '../../../carbonio-ui-commons/components/list/list';
import { CustomListItem } from '../../../carbonio-ui-commons/components/list/list-item';
import { handleKeyboardShortcuts } from '../../../hooks/keyboard-shortcuts';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useConversationListItems } from '../../../hooks/use-conversation-list';
import { useSelection } from '../../../hooks/useSelection';
import { search } from '../../../store/actions';
import {
	selectConversationStatus,
	selectFolderSearchStatus
} from '../../../store/conversations-slice';
import { AppContext, Conversation } from '../../../types';
import SelectPanelActions from '../../../ui-actions/select-panel-action';
import ShimmerList from '../../search/shimmer-list';
import { Breadcrumbs } from './breadcrumbs';
import ConversationListItem from './lists-item/conversation-list-item';

const DragImageContainer = styled.div`
	position: absolute;
	top: -312.5rem;
	left: -312.5rem;
	transform: translate(-100%, -100%);
	width: 35vw;
`;

const DragItems: FC<{
	conversations: Conversation[];
	draggedIds: Record<string, boolean> | undefined;
}> = ({ conversations, draggedIds }) => {
	const items = reduce(
		draggedIds,
		(acc: Conversation[], v, k) => {
			const obj = find(conversations, ['id', k]);
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
				<ConversationListItem
					item={item}
					key={item.id}
					draggedIds={draggedIds}
					folderId={''}
					activeItemId={item.id}
					selected={false}
					selecting={false}
					toggle={noop}
				/>
			))}
		</>
	);
};

const ConversationList: FC = () => {
	const { folderId, itemId } = useParams<{ folderId: string; itemId: string }>();
	const { setCount, count } = useAppContext<AppContext>();
	const conversations = useConversationListItems();

	const [isDragging, setIsDragging] = useState(false);
	const [draggedIds, setDraggedIds] = useState<Record<string, boolean>>();
	const [isLoading, setIsLoading] = useState(false);
	const dragImageRef = useRef(null);
	const dispatch = useAppDispatch();
	const createSnackbar = useContext(SnackbarManagerContext);
	const status = useSelector(selectConversationStatus);

	const conversationListStatus = useAppSelector((store) =>
		selectFolderSearchStatus(store, folderId)
	);

	const {
		selected,
		toggle,
		deselectAll,
		isSelectModeOn,
		setIsSelectModeOn,
		selectAll,
		isAllSelected,
		selectAllModeOff
	} = useSelection(folderId, setCount, count, conversations);

	const folder = useFolder(folderId);
	const hasMore = useMemo(() => status === 'hasMore', [status]);

	const loadMore = useCallback(
		(date) => {
			if (hasMore && !isLoading) {
				setIsLoading(true);
				const dateOrNull = date ? new Date(date) : null;
				dispatch(search({ folderId, before: dateOrNull, limit: 50 })).then(() => {
					setIsLoading(false);
				});
			}
		},
		[hasMore, isLoading, dispatch, folderId]
	);

	useEffect(() => {
		const handler = (event: KeyboardEvent): void =>
			handleKeyboardShortcuts({
				event,
				folderId,
				itemId,
				conversations,
				dispatch,
				deselectAll,
				createSnackbar
			});
		document.addEventListener('keydown', handler);
		return () => {
			document.removeEventListener('keydown', handler);
		};
	}, [folderId, itemId, conversations, dispatch, deselectAll, createSnackbar]);

	const displayerTitle = useMemo(() => {
		if (conversations?.length === 0) {
			if (folderId === '4') {
				return t('displayer.list_spam_title', 'There are no spam e-mails');
			}
			if (folderId === '5') {
				return t('displayer.list_sent_title', 'You haven’t sent any e-mail yet');
			}
			if (folderId === '6') {
				return t('displayer.list_draft_title', 'There are no saved drafts');
			}
			if (folderId === '3') {
				return t('displayer.list_trash_title', 'The trash is empty');
			}
			return t('displayer.list_folder_title', 'It looks like there are no e-mails yet');
		}
		return null;
	}, [conversations, folderId]);

	const listItems = useMemo(
		() =>
			map(conversations, (conversation) => {
				const isActive = itemId === conversation.id;
				const isSelected = selected[conversation.id];
				return (
					<CustomListItem
						active={isActive}
						selected={isSelected}
						background={conversation.read ? 'gray6' : 'gray5'}
						key={conversation.id}
					>
						{(isVisible: boolean): JSX.Element => (
							<ConversationListItem
								item={conversation}
								visible={isVisible}
								selected={isSelected}
								activeItemId={itemId}
								toggle={toggle}
								folderId={folderId}
								setDraggedIds={setDraggedIds}
								setIsDragging={setIsDragging}
								selectedItems={selected}
								dragImageRef={dragImageRef}
								selecting={isSelectModeOn}
								active={isActive}
							/>
						)}
					</CustomListItem>
				);
			}),
		[conversations, folderId, isSelectModeOn, itemId, selected, toggle]
	);

	return (
		<>
			{isSelectModeOn ? (
				<SelectPanelActions
					conversation={conversations}
					folderId={folderId}
					selectedIds={selected}
					deselectAll={deselectAll}
					selectAll={selectAll}
					isAllSelected={isAllSelected}
					selectAllModeOff={selectAllModeOff}
				/>
			) : (
				<Breadcrumbs
					folderPath={folder?.absFolderPath}
					folderId={folderId}
					itemsCount={folder?.n}
					isSelectModeOn={isSelectModeOn}
					setIsSelectModeOn={setIsSelectModeOn}
				/>
			)}
			{conversationListStatus === 'complete' ? (
				<>
					<Divider color="gray2" />
					{conversations?.length === 0 ? (
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
					) : (
						<CustomList
							onListBottom={(): void =>
								loadMore(conversations?.[(conversations?.length ?? 1) - 1]?.date)
							}
							data-testid={`conversation-list-${folderId}`}
						>
							{listItems}
						</CustomList>
					)}
					<DragImageContainer ref={dragImageRef}>
						{isDragging && <DragItems conversations={conversations} draggedIds={draggedIds} />}
					</DragImageContainer>
				</>
			) : (
				<ShimmerList count={folder?.itemsCount} delay={500} />
			)}
		</>
	);
};
export default ConversationList;
