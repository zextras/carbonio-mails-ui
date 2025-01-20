/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, memo, ReactNode, useCallback, useMemo, useState } from 'react';

import { Container, ContainerProps, Dropdown } from '@zextras/carbonio-design-system';
import { pushHistory, useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce, find, reduce, uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { ConversationListItemCore } from './conversation-list-item-core';
import { ConversationMessagesList } from './conversation-messages-list';
import { getFolderParentId } from './utils';
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeDropdownActionItem } from '../../../../helpers/actions';
import { getFolderIdParts } from '../../../../helpers/folders';
import { useConvActions } from '../../../../hooks/actions/use-conv-actions';
import { useConvPreviewOnSeparatedWindowFn } from '../../../../hooks/actions/use-conv-preview-on-separated-window';
import { useConvSetReadFn } from '../../../../hooks/actions/use-conv-set-read';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { useOnMouseHover } from '../../../../hooks/use-on-mouse-over';
import { useTagDropdownItem } from '../../../../hooks/use-tag-dropdown-item';
import { searchConv } from '../../../../store/actions';
import { selectConversationExpandedStatus } from '../../../../store/conversations-slice';
import { selectMessages } from '../../../../store/messages-slice';
import {
	ConvMessage,
	ConversationListItemProps,
	IncompleteMessage,
	MailsStateType,
	Conversation
} from '../../../../types';
import { ConversationPreviewPanel } from '../../detail-panel/conversation-preview-panel';
import { HoverBarContainer } from '../parts/hover-bar-container';
import { HoverContainer } from '../parts/hover-container';
import { ListItemHoverActions } from '../parts/list-item-hover-actions';

const CollapseElement = styled(Container)<{ $open: boolean }>`
	display: ${({ $open }): string => ($open ? 'block' : 'none')};
`;

export const ConversationListItemActionWrapper = ({
	item,
	active,
	onClick,
	onDoubleClick,
	deselectAll,
	shouldReplaceHistory,
	children
}: {
	children?: ReactNode;
	onClick?: ContainerProps['onClick'];
	onDoubleClick?: ContainerProps['onDoubleClick'];
	shouldReplaceHistory?: boolean;
	active?: boolean;
	item: Conversation;
	deselectAll: () => void;
}): React.JSX.Element => {
	const conversationPreviewFactory = useCallback(
		() => <ConversationPreviewPanel conversation={item} isInsideExtraWindow />,
		[item]
	);
	const [t] = useTranslation();
	const {
		replyDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		forwardAsAttachmentDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		setAsReadDescriptor,
		setAsUnreadDescriptor,
		setFlagDescriptor,
		unflagDescriptor,
		markAsSpamDescriptor,
		markAsNotSpamDescriptor,
		applyTagDescriptor,
		moveToFolderDescriptor,
		restoreFolderDescriptor,
		printDescriptor,
		previewOnSeparatedWindowDescriptor,
		showOriginalDescriptor
	} = useConvActions({
		conversation: item,
		deselectAll,
		conversationPreviewFactory,
		shouldReplaceHistory
	});
	console.log('@@@@@@@@@@@@@@@@@@@@conversation actions calculated');
	const hoverActions = useMemo(
		() => [
			replyDescriptor,
			replyAllDescriptor,
			forwardDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			setAsReadDescriptor,
			setAsUnreadDescriptor,
			setFlagDescriptor,
			unflagDescriptor,
			restoreFolderDescriptor
		],
		[
			replyDescriptor,
			replyAllDescriptor,
			forwardDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			setAsReadDescriptor,
			setAsUnreadDescriptor,
			setFlagDescriptor,
			unflagDescriptor,
			restoreFolderDescriptor
		]
	);
	const tagItem = useTagDropdownItem(applyTagDescriptor, item.tags);
	const dropdownItems = useMemo(
		() =>
			[
				normalizeDropdownActionItem(replyDescriptor),
				normalizeDropdownActionItem(replyAllDescriptor),
				{
					id: 'ForwardMenu',
					icon: 'Forward',
					label: t('action.forward', 'Forward'),
					disabled: !forwardDescriptor.canExecute() && !forwardAsAttachmentDescriptor.canExecute(),
					items: [
						normalizeDropdownActionItem(forwardDescriptor),
						normalizeDropdownActionItem(forwardAsAttachmentDescriptor)
					]
				},
				normalizeDropdownActionItem(moveToTrashDescriptor),
				normalizeDropdownActionItem(deletePermanentlyDescriptor),
				normalizeDropdownActionItem(setAsReadDescriptor),
				normalizeDropdownActionItem(setAsUnreadDescriptor),
				normalizeDropdownActionItem(setFlagDescriptor),
				normalizeDropdownActionItem(unflagDescriptor),
				normalizeDropdownActionItem(markAsSpamDescriptor),
				normalizeDropdownActionItem(markAsNotSpamDescriptor),
				tagItem,
				normalizeDropdownActionItem(moveToFolderDescriptor),
				normalizeDropdownActionItem(restoreFolderDescriptor),
				normalizeDropdownActionItem(printDescriptor),
				normalizeDropdownActionItem(previewOnSeparatedWindowDescriptor),
				normalizeDropdownActionItem(showOriginalDescriptor)
			].filter((action) => !action.disabled),
		[
			replyDescriptor,
			replyAllDescriptor,
			forwardDescriptor,
			forwardAsAttachmentDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			setAsReadDescriptor,
			setAsUnreadDescriptor,
			setFlagDescriptor,
			unflagDescriptor,
			markAsSpamDescriptor,
			markAsNotSpamDescriptor,
			tagItem,
			moveToFolderDescriptor,
			restoreFolderDescriptor,
			printDescriptor,
			previewOnSeparatedWindowDescriptor,
			showOriginalDescriptor,
			t
		]
	);

	return (
		<Dropdown
			contextMenu
			items={dropdownItems}
			display="block"
			style={{ width: '100%', height: '4rem' }}
			data-testid={`secondary-actions-menu-${item.id}`}
		>
			<HoverContainer
				data-testid={`hover-container-${item.id}`}
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment="unset"
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				$hoverBackground={active ? 'highlight' : 'gray6'}
			>
				{children}
				<HoverBarContainer
					orientation="horizontal"
					mainAlignment="flex-end"
					crossAlignment="center"
					background={active ? 'highlight' : 'gray6'}
					data-testid={`primary-actions-bar-${item.id}`}
				>
					<ListItemHoverActions actions={hoverActions} />
				</HoverBarContainer>
			</HoverContainer>
		</Dropdown>
	);
};

export const ConversationListItem: FC<ConversationListItemProps> = memo(
	function ConversationListItem({
		item,
		selected,
		selecting,
		toggle,
		active,
		isSearchModule,
		activeItemId,
		dragImageRef,
		deselectAll,
		folderId,
		setDraggedIds
	}) {
		const { itemId } = useParams<{ itemId: string }>();
		const dispatch = useAppDispatch();
		const [open, setOpen] = useState(false);
		const messages = useAppSelector(selectMessages);
		const isConversation = 'messages' in (item || {});
		const folderParent = getFolderParentId({ folderId: folderId ?? '', isConversation, item });
		const [t] = useTranslation();

		const markAsRead = useConvSetReadFn({
			ids: [item.id],
			isConversationRead: item.read,
			deselectAll,
			folderId: folderId ?? ''
		});

		const conversationPreviewFactory = useCallback(
			() => <ConversationPreviewPanel conversation={item} isInsideExtraWindow />,
			[item]
		);

		const previewOnSeparatedWindow = useConvPreviewOnSeparatedWindowFn({
			conversationId: item.id,
			subject: item.subject,
			conversationPreviewFactory
		});

		const conversationStatus = useAppSelector((state: MailsStateType) =>
			selectConversationExpandedStatus(state, item.id)
		);

		const sortBy = useUserSettings()?.prefs?.zimbraPrefConversationOrder || 'dateDesc';
		const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

		const toggleOpen = useCallback(
			(
				e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent | MouseEvent | KeyboardEvent
			) => {
				e.preventDefault();
				setOpen((currentlyOpen) => {
					if (
						!currentlyOpen &&
						conversationStatus !== API_REQUEST_STATUS.fulfilled &&
						conversationStatus !== API_REQUEST_STATUS.pending
					) {
						dispatch(searchConv({ folderId: folderParent, conversationId: item.id, fetch: 'all' }));
					}
					return !currentlyOpen;
				});
			},
			[conversationStatus, dispatch, folderParent, item.id]
		);

		const debouncedPushHistory = useMemo(
			() =>
				debounce(() => pushHistory(`/folder/${folderParent}/conversation/${item.id}`), 200, {
					leading: false,
					trailing: true
				}),
			[folderParent, item.id]
		);

		const _onClick = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				if (!e.isDefaultPrevented()) {
					if (item?.read === false && zimbraPrefMarkMsgRead) {
						markAsRead.canExecute() && markAsRead.execute();
					}
					debouncedPushHistory();
				}
			},
			[item?.read, zimbraPrefMarkMsgRead, debouncedPushHistory, markAsRead]
		);

		const _onDoubleClick = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				if (e.isDefaultPrevented()) {
					return;
				}
				debouncedPushHistory.cancel();
				const { id, isDraft } = item.messages[0];
				if (isDraft) {
					pushHistory(`/folder/${folderParent}/edit/${id}?action=editAsDraft`);
				} else {
					previewOnSeparatedWindow.canExecute() && previewOnSeparatedWindow.execute();
				}
			},

			[debouncedPushHistory, folderParent, item.messages, previewOnSeparatedWindow]
		);

		const sortSign = useMemo(() => (sortBy === 'dateDesc' ? -1 : 1), [sortBy]);

		// this is the array of all the messages of this conversation to render in this folder
		const messagesToRender = useMemo(
			() =>
				uniqBy(
					reduce<ConvMessage, IncompleteMessage[]>(
						item.messages,
						(acc, v) => {
							const msg = find(messages, ['id', v.id]);

							if (msg) {
								// in trash, we show all messages of the conversation even if only one is deleted
								if (getFolderIdParts(folderParent).id === FOLDERS.TRASH) {
									return [...acc, msg];
								}
								// all other messages are valid and must be showed in the conversation
								return [...acc, msg];
							}
							return acc;
						},
						[]
					).sort((a, b) => (a.date && b.date ? sortSign * (a.date - b.date) : 1)),
					'id'
				),
			[item, messages, folderParent, sortSign]
		);

		const shouldReplaceHistory = useMemo(() => itemId === item.id, [item.id, itemId]);
		const [ref, isHovered] = useOnMouseHover();
		return (
			<Container
				mainAlignment="flex-start"
				data-testid={`ConversationListItem-${item.id}`}
				ref={ref}
			>
				{isHovered ? (
					<ConversationListItemActionWrapper
						item={item}
						active={active}
						onClick={_onClick}
						onDoubleClick={_onDoubleClick}
						shouldReplaceHistory={shouldReplaceHistory}
						deselectAll={deselectAll}
					>
						<ConversationListItemCore
							item={item}
							selected={selected}
							selecting={selecting}
							toggle={toggle}
							folderParent={folderParent}
							open={open}
							toggleOpen={toggleOpen}
						/>
					</ConversationListItemActionWrapper>
				) : (
					<ConversationListItemCore
						item={item}
						selected={selected}
						selecting={selecting}
						toggle={toggle}
						folderParent={folderParent}
						open={open}
						toggleOpen={toggleOpen}
					/>
				)}
				{open && (
					<CollapseElement
						$open={open}
						data-testid="ConversationExpander"
						padding={{ left: 'extralarge' }}
						height="auto"
					>
						<ConversationMessagesList
							active={activeItemId}
							length={item.messagesInConversation}
							messages={messagesToRender}
							conversationStatus={conversationStatus}
							folderId={folderParent}
							dragImageRef={dragImageRef}
							isSearchModule={isSearchModule}
							setDraggedIds={setDraggedIds}
						/>
					</CollapseElement>
				)}
			</Container>
		);
	}
);
