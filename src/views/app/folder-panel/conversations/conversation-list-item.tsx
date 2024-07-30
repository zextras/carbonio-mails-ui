/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import {
	Badge,
	Container,
	ContainerProps,
	Icon,
	IconButton,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import {
	Tag,
	pushHistory,
	t,
	useTags,
	useUserAccounts,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { filter, find, forEach, includes, isEmpty, reduce, trimStart, uniqBy } from 'lodash';
import styled from 'styled-components';

import { ConversationMessagesList } from './conversation-messages-list';
import { getFolderParentId } from './utils';
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { ZIMBRA_STANDARD_COLORS } from '../../../../carbonio-ui-commons/constants/utils';
import { participantToString } from '../../../../commons/utils';
import { API_REQUEST_STATUS } from '../../../../constants';
import { getFolderIdParts } from '../../../../helpers/folders';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { searchConv } from '../../../../store/actions';
import { selectConversationExpandedStatus } from '../../../../store/conversations-slice';
import { selectMessages } from '../../../../store/messages-slice';
import type {
	ConvMessage,
	ConversationListItemProps,
	IncompleteMessage,
	MailsStateType,
	TextReadValuesProps
} from '../../../../types';
import {
	previewConversationOnSeparatedWindowAction,
	setConversationsRead
} from '../../../../ui-actions/conversation-actions';
import { useGlobalExtraWindowManager } from '../../extra-windows/global-extra-window-manager';
import { ItemAvatar } from '../parts/item-avatar';
import { ListItemActionWrapper } from '../parts/list-item-actions-wrapper';
import { RowInfo } from '../parts/row-info';
import { SenderName } from '../parts/sender-name';

const CollapseElement = styled(Container)<ContainerProps & { open: boolean }>`
	display: ${({ open }): string => (open ? 'block' : 'none')};
`;

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
		const dispatch = useAppDispatch();
		const [open, setOpen] = useState(false);
		const accounts = useUserAccounts();
		const messages = useAppSelector(selectMessages);
		const isConversation = 'messages' in (item || {});
		const { createWindow } = useGlobalExtraWindowManager();

		const folderParent = getFolderParentId({ folderId: folderId ?? '', isConversation, item });

		const conversationStatus = useAppSelector((state: MailsStateType) =>
			selectConversationExpandedStatus(state, item.id)
		);
		const tagsFromStore = useTags();
		const tags = useMemo(
			() =>
				uniqBy(
					reduce(
						tagsFromStore,
						(acc: Array<Tag>, v) => {
							if (includes(item.tags, v.id)) {
								acc.push({
									...v,
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									color: ZIMBRA_STANDARD_COLORS[v.color || 0].hex
								});
							} else if (item.tags?.length > 0 && !includes(item.tags, v.id)) {
								forEach(
									filter(item.tags, (tn) => tn.includes('nil:')),
									(tagNotInList) => {
										acc.push({
											id: tagNotInList,
											name: tagNotInList.split(':')[1],
											color: 1
										});
									}
								);
							}
							return acc;
						},
						[]
					),
					'id'
				),
			[item.tags, tagsFromStore]
		);

		const sortBy = useUserSettings()?.prefs?.zimbraPrefConversationOrder || 'dateDesc';
		const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';
		const participantsString = useMemo(
			() =>
				reduce(
					uniqBy(item.participants, (em) => em.address),
					(acc, part) => trimStart(`${acc}, ${participantToString(part, accounts)}`, ', '),
					''
				),
			[item.participants, accounts]
		);

		const toggleOpen = useCallback(
			(e) => {
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

		const _onClick = useCallback(
			(e) => {
				if (!e.isDefaultPrevented()) {
					if (item?.read === false && zimbraPrefMarkMsgRead) {
						setConversationsRead({
							ids: [item.id],
							value: false,
							dispatch,
							folderId: folderParent,
							deselectAll,
							shouldReplaceHistory: false
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
						}).onClick();
					}
					pushHistory(`/folder/${folderParent}/conversation/${item.id}`);
				}
			},
			[item?.read, item.id, zimbraPrefMarkMsgRead, folderParent, dispatch, deselectAll]
		);

		const _onDoubleClick = useCallback(
			(e) => {
				if (e.isDefaultPrevented()) {
					return;
				}

				const { id, isDraft } = item.messages[0];
				if (isDraft) {
					pushHistory(`/folder/${folderParent}/edit/${id}?action=editAsDraft`);
				} else {
					previewConversationOnSeparatedWindowAction(
						item.id,
						folderParent,
						item.subject,
						createWindow
					).onClick();
				}
			},

			[createWindow, folderParent, item.id, item.messages, item.subject]
		);

		const toggleExpandButtonLabel = useMemo(
			() => (open ? t('label.hide', 'Hide') : t('label.expand', 'Expand')),
			[open]
		);
		const subject = useMemo(
			() => item.subject || t('label.no_subject_with_tags', '<No Subject>'),
			[item.subject]
		);
		const subFragmentTooltipLabel = useMemo(
			() => (!isEmpty(item.fragment) ? item.fragment : subject),
			[subject, item.fragment]
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

		/**
		 * This is the number of messages to display in the conversation badge.
		 * In search module we check if the user has enabled the option to show trashed and/or spam messages
		 * @returns {number}
		 */
		const getmsgToDisplayCount = useCallback((): number => item.messagesInConversation, [item]);

		const textReadValues: TextReadValuesProps = useMemo(() => {
			if (typeof item.read === 'undefined')
				return { color: 'text', weight: 'regular', badge: 'read' };
			return item.read
				? { color: 'text', weight: 'regular', badge: 'read' }
				: { color: 'primary', weight: 'bold', badge: 'unread' };
		}, [item.read]);

		const renderBadge = useMemo(() => {
			if (item.messagesInConversation === 1) return textReadValues.badge === 'unread';
			if (item.messagesInConversation > 0) return true;
			if (item?.messages?.length === 1) {
				return textReadValues.badge === 'unread';
			}
			return item?.messages?.length > 0;
		}, [item?.messages?.length, item.messagesInConversation, textReadValues.badge]);

		return (
			<Container mainAlignment="flex-start" data-testid={`ConversationListItem-${item.id}`}>
				<ListItemActionWrapper
					item={item}
					active={active}
					onClick={_onClick}
					onDoubleClick={_onDoubleClick}
					hoverTooltipLabel={participantsString}
					deselectAll={deselectAll}
				>
					<div
						style={{ alignSelf: 'center' }}
						data-testid={`conversation-list-item-avatar-${item.id}`}
					>
						<ItemAvatar
							item={item}
							selected={selected}
							selecting={selecting}
							toggle={toggle}
							folderId={folderParent}
						/>
						<Padding horizontal="extrasmall" />
					</div>
					<Row
						takeAvailableSpace
						orientation="horizontal"
						wrap="wrap"
						padding={{ left: 'small', top: 'small', bottom: 'small', right: 'large' }}
					>
						<Container orientation="horizontal" height="fit" width="fill">
							<SenderName item={item} textValues={textReadValues} />
							<RowInfo item={item} tags={tags} />
						</Container>
						<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
							{renderBadge && (
								<Row>
									<Padding right="extrasmall">
										<Badge
											data-testid={`conversation-messages-count-${item.id}`}
											value={getmsgToDisplayCount()}
											type={textReadValues.badge}
										/>
									</Padding>
								</Row>
							)}

							<Tooltip label={subFragmentTooltipLabel} overflow="break-word" maxWidth="60vw">
								<Row
									wrap="nowrap"
									takeAvailableSpace
									mainAlignment="flex-start"
									crossAlignment="baseline"
								>
									<Text
										data-testid="Subject"
										weight={textReadValues.weight}
										color={item.subject ? 'text' : 'secondary'}
									>
										{subject}
									</Text>
								</Row>
							</Tooltip>
							<Row>
								{item.urgent && <Icon data-testid="UrgentIcon" icon="ArrowUpward" color="error" />}
								{item.messagesInConversation > 1 && (
									<Tooltip label={toggleExpandButtonLabel}>
										<IconButton
											data-testid="ToggleExpand"
											size="small"
											icon={open ? 'ArrowIosUpward' : 'ArrowIosDownward'}
											onClick={toggleOpen}
										/>
									</Tooltip>
								)}
							</Row>
						</Container>
					</Row>
				</ListItemActionWrapper>
				{open && (
					<CollapseElement
						open={open}
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
