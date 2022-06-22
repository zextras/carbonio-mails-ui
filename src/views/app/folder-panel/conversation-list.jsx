/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useRef, useState, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
	List,
	SnackbarManagerContext,
	Divider,
	Container,
	Padding,
	Text
} from '@zextras/carbonio-design-system';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { find, map, reduce } from 'lodash';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';
import {
	selectConversationStatus,
	selectFolder,
	selectFolderSearchStatus
} from '../../../store/conversations-slice';
import ConversationListItem from './lists-item/conversation-list-item';
import { search } from '../../../store/actions';
import SelectPanelActions from '../../../ui-actions/select-panel-action';
import { Breadcrumbs } from './breadcrumbs';
import { useSelection } from '../../../hooks/useSelection';
import { handleKeyboardShortcuts } from '../../../hooks/keyboard-shortcuts';
import { useConversationListItems } from '../../../hooks/use-conversation-list';
import ShimmerList from '../../search/shimmer-list';

const DragImageContainer = styled.div`
	position: absolute;
	top: -5000px;
	left: -5000px;
	transform: translate(-100%, -100%);
	width: 35vw;
`;

const DragItems = ({ conversations, draggedIds }) => {
	const items = reduce(
		draggedIds,
		(acc, v, k) => {
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
				<ConversationListItem item={item} key={item.id} draggedIds={draggedIds} />
			))}
		</>
	);
};

const ConversationList = () => {
	const { folderId, itemId } = useParams();
	const { setCount } = useAppContext();
	const conversations = useConversationListItems();

	const [isDragging, setIsDragging] = useState(false);
	const [draggedIds, setDraggedIds] = useState();
	const [isLoading, setIsLoading] = useState(false);
	const dragImageRef = useRef(null);
	const dispatch = useDispatch();
	const [t] = useTranslation();
	const createSnackbar = useContext(SnackbarManagerContext);
	const status = useSelector(selectConversationStatus);
	const conversationListStatus = useSelector((store) => selectFolderSearchStatus(store, folderId));

	const { selected, isSelecting, toggle, deselectAll } = useSelection(folderId, setCount);
	const folder = useSelector((state) => selectFolder(state, folderId));

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
		const handler = (event) =>
			handleKeyboardShortcuts({
				event,
				folderId,
				itemId,
				conversations,
				t,
				dispatch,
				deselectAll,
				createSnackbar
			});
		document.addEventListener('keydown', handler);
		return () => {
			document.removeEventListener('keydown', handler);
		};
	}, [folderId, itemId, conversations, t, dispatch, deselectAll, createSnackbar]);
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
	}, [t, conversations, folderId]);
	return (
		<>
			{isSelecting ? (
				<SelectPanelActions
					conversation={conversations}
					folderId={folderId}
					selectedIds={selected}
					deselectAll={deselectAll}
				/>
			) : (
				<Breadcrumbs
					folderPath={folder?.path.substring(1)}
					folderId={folderId}
					itemsCount={folder?.itemsCount}
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
									style={{ whiteSpace: 'pre-line', textAlign: 'center', paddingTop: '32px' }}
								>
									{displayerTitle}
								</Text>
							</Padding>
						</Container>
					) : (
						<Container style={{ minHeight: 0 }}>
							<List
								style={{ flexGrow: 1, paddingBottom: '4px' }}
								background="gray6"
								selected={selected}
								active={itemId}
								items={conversations}
								itemProps={{
									itemId,
									toggle,
									// messages,
									folderId,
									setDraggedIds,
									setIsDragging,
									selectedItems: selected,
									dragImageRef
								}}
								ItemComponent={ConversationListItem}
								onListBottom={() =>
									loadMore(conversations?.[(conversations?.length ?? 1) - 1]?.date)
								}
								data-testid={`conversation-list-${folderId}`}
							/>
						</Container>
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
