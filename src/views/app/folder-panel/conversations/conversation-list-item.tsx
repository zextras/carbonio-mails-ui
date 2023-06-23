/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
	FOLDERS,
	Tag,
	ZIMBRA_STANDARD_COLORS,
	pushHistory,
	t,
	useTags,
	useUserAccounts,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { filter, find, forEach, includes, isEmpty, reduce, trimStart, uniqBy } from 'lodash';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { participantToString } from '../../../../commons/utils';
import { getFolderIdParts } from '../../../../helpers/folders';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { searchConv } from '../../../../store/actions';
import { selectConversationExpandedStatus } from '../../../../store/conversations-slice';
import { selectMessages } from '../../../../store/messages-slice';
import type {
	ConvMessage,
	ConversationListItemProps,
	IncompleteMessage,
	StateType,
	TextReadValuesProps
} from '../../../../types';
import { setConversationsRead } from '../../../../ui-actions/conversation-actions';
import { ItemAvatar } from '../parts/item-avatar';
import { ListItemActionWrapper } from '../parts/list-item-actions-wrapper';
import { RowInfo } from '../parts/row-info';
import { SenderName } from '../parts/sender-name';
import { ConversationMessagesList } from './conversation-messages-list';
import { getFolderParentId } from './utils';

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

		const folderParent = getFolderParentId({ folderId: folderId ?? '', isConversation, item });

		const conversationStatus = useAppSelector((state: StateType) =>
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
						conversationStatus !== 'complete' &&
						conversationStatus !== 'pending'
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
				if (!e.isDefaultPrevented()) {
					const { id, isDraft } = item.messages[0];

					if (isDraft) pushHistory(`/folder/${folderParent}/edit/${id}?action=editAsDraft`);
				}
			},

			[folderParent, item.messages]
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
								if (folderParent === FOLDERS.TRASH) {
									return [...acc, msg];
								}
								// deleted and spam messages are hidden in all folders except trash and spam
								if (
									(msg.parent === FOLDERS.TRASH && folderParent !== FOLDERS.TRASH) ||
									(msg.parent === FOLDERS.SPAM && folderParent !== FOLDERS.SPAM)
								) {
									return acc;
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
			[item?.messages, folderParent, messages, sortSign]
		);

		/**
		 * This is the number of messages to display in the conversation badge.
		 * In trash, we show all messages of the conversation even if only one is deleted
		 * In spam, we show all messages of the conversation even if only one is spam
		 * In all other folders, we show only messages that are not deleted or spam
		 * @returns {number}
		 */

		const getmsgToDisplayCount = useCallback((): number => {
			if ([FOLDERS.TRASH, FOLDERS.SPAM].includes(getFolderIdParts(folderParent).id ?? ''))
				return item?.messages?.length;
			return filter(
				item?.messages,
				(msg) => ![FOLDERS.TRASH, FOLDERS.SPAM].includes(getFolderIdParts(msg.parent).id ?? '')
			)?.length;
		}, [folderParent, item?.messages]);

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
								{item?.messages?.length > 1 && (
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
							length={item?.messages?.length}
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
