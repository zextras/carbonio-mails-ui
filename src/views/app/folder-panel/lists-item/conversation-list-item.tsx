/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Badge,
	Button,
	Container,
	ContainerProps,
	Drag,
	Icon,
	IconButton,
	ListV2,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import {
	FOLDERS,
	pushHistory,
	t,
	Tag,
	useTags,
	useUserAccounts,
	useUserSettings,
	ZIMBRA_STANDARD_COLORS
} from '@zextras/carbonio-shell-ui';
import {
	filter,
	find,
	forEach,
	includes,
	isEmpty,
	map,
	noop,
	reduce,
	trimStart,
	uniqBy
} from 'lodash';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';

import { getTimeLabel, participantToString } from '../../../../commons/utils';
import { searchConv } from '../../../../store/actions';
import { selectConversationExpandedStatus } from '../../../../store/conversations-slice';
import { selectMessages } from '../../../../store/messages-slice';
import {
	Conversation,
	ConversationMessagesListProps,
	ConvMessage,
	IncompleteMessage,
	MessageListItemProps,
	StateType,
	TextReadValuesProps
} from '../../../../types';
import { setConversationsRead } from '../../../../ui-actions/conversation-actions';
import { useTagExist } from '../../../../ui-actions/tag-actions';
import { ItemAvatar } from './item-avatar';
import { ListItemActionWrapper } from './list-item-actions-wrapper';
import { MessageListItem } from './message-list-item';
import { SenderName } from './sender-name';

export const ConversationMessagesList: FC<ConversationMessagesListProps> = ({
	active,
	conversationStatus,
	messages,
	folderId,
	length,
	isFromSearch
}) => {
	const messagesToRender = useMemo<MessageListItemProps['item'][]>(
		() =>
			map(messages, (item) => ({
				...item,
				id: item.id ?? '',
				isFromSearch
			})),
		[isFromSearch, messages]
	);

	const listItems = useMemo(
		() =>
			map(messagesToRender, (message) => {
				const isActive = active === message.id || active === message.conversation;
				return (
					<CustomListItem
						selected={false}
						active={isActive}
						key={message.id}
						background={'transparent'}
					>
						{(isVisible: boolean): JSX.Element => (
							<MessageListItem
								folderId={folderId}
								isConvChildren
								item={message}
								selected={false}
								selecting={false}
								draggedIds={{}}
								setDraggedIds={noop}
								setIsDragging={noop}
								selectedItems={{}}
								visible={isVisible}
								active={isActive}
							/>
						)}
					</CustomListItem>
				);
			}),
		[active, folderId, messagesToRender]
	);

	if (conversationStatus !== 'complete') {
		return (
			<Container height={64 * length}>
				<Button loading disabled label="" type="ghost" onClick={noop} />
			</Container>
		);
	}

	return <ListV2 style={{ paddingBottom: '0.25rem' }}>{listItems}</ListV2>;
};

const CollapseElement = styled(Container)<ContainerProps & { open: boolean }>`
	display: ${({ open }): string => (open ? 'block' : 'none')};
`;

type RowInfoProps = {
	item: Conversation;
	tags: Array<Tag>;
	isFromSearch?: boolean;
	allMessagesInTrash?: boolean;
};

export const RowInfo: FC<RowInfoProps> = ({ item, tags, isFromSearch, allMessagesInTrash }) => {
	const date = useMemo(() => getTimeLabel(item.date), [item.date]);

	const tagIcon = useMemo(() => (tags?.length > 1 ? 'TagsMoreOutline' : 'Tag'), [tags]);
	const tagIconColor = useMemo(() => (tags?.length === 1 ? tags?.[0]?.color : undefined), [tags]);

	const isTagInStore = useTagExist(tags);
	const showTagIcon = useMemo(
		() => item.tags && item.tags.length !== 0 && item.tags?.[0] !== '' && isTagInStore,
		[isTagInStore, item.tags]
	);

	return (
		<Row>
			{allMessagesInTrash && isFromSearch && (
				<Padding left="small">
					<Icon data-testid="TrashIcon" icon="Trash2Outline" />
				</Padding>
			)}
			{showTagIcon && (
				<Padding left="small">
					<Icon data-testid="TagIcon" icon={tagIcon} color={`${tagIconColor}`} />
				</Padding>
			)}
			{item.hasAttachment && (
				<Padding left="small">
					<Icon data-testid="AttachmentIcon" icon="AttachOutline" />
				</Padding>
			)}
			{item.flagged && (
				<Padding left="small">
					<Icon data-testid="FlagIcon" color="error" icon="Flag" />
				</Padding>
			)}
			<Padding left="small" data-testid="DateLabel">
				<Text size="extrasmall">{date}</Text>
			</Padding>
		</Row>
	);
};

type ConversationListItemProps = {
	item: Conversation;
	activeItemId: string;
	folderId: string;
	selected: boolean;
	selecting: boolean;
	toggle: () => void;
	active?: boolean;
	visible?: boolean;
	setDraggedIds?: (ids: Record<string, boolean>) => void;
	draggedIds?: Record<string, boolean> | undefined;
	setIsDragging?: (isDragging: boolean) => void;
	selectedItems?: Record<string, boolean>;
	dragImageRef?: React.RefObject<HTMLInputElement>;
};

const ConversationListItem: FC<ConversationListItemProps> = ({
	activeItemId,
	item,
	folderId,
	selected,
	selecting,
	toggle,
	active,
	visible,
	setDraggedIds,
	draggedIds,
	setIsDragging,
	selectedItems,
	dragImageRef
}) => {
	const dispatch = useDispatch();
	const [open, setOpen] = useState(false);
	const accounts = useUserAccounts();
	const messages = useSelector(selectMessages);
	const conversationStatus = useSelector((state: StateType) =>
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
	const ids = useMemo(() => Object.keys(selectedItems ?? []), [selectedItems]);

	const toggleOpen = useCallback(
		(e) => {
			e.preventDefault();
			setOpen((currentlyOpen) => {
				if (
					!currentlyOpen &&
					conversationStatus !== 'complete' &&
					conversationStatus !== 'pending'
				) {
					dispatch(searchConv({ folderId, conversationId: item.id, fetch: 'all' }));
				}
				return !currentlyOpen;
			});
		},
		[conversationStatus, dispatch, folderId, item.id]
	);

	const _onClick = useCallback(
		(e) => {
			if (!e.isDefaultPrevented()) {
				if (item?.read === false && zimbraPrefMarkMsgRead) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					setConversationsRead({
						ids: [item.id],
						value: false,
						dispatch
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
					})?.click();
				}
				pushHistory(`/folder/${folderId}/conversation/${item.id}`);
			}
		},
		[item?.read, item.id, zimbraPrefMarkMsgRead, folderId, dispatch]
	);

	const _onDoubleClick = useCallback(
		(e) => {
			if (!e.isDefaultPrevented()) {
				const { id, isDraft } = item.messages[0];

				if (isDraft) pushHistory(`/folder/${folderId}/edit/${id}?action=editAsDraft`);
			}
		},

		[folderId, item.messages]
	);

	const dragCheck = useCallback(
		(e, id) => {
			setIsDragging && setIsDragging(true);
			dragImageRef && e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
			if (selectedItems && selectedItems[id]) {
				setDraggedIds && setDraggedIds(selectedItems);
			} else {
				setDraggedIds && setDraggedIds({ [id]: true });
			}
		},
		[setIsDragging, dragImageRef, selectedItems, setDraggedIds]
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
							// in trash we show all messages of the conversation even if only one is deleted
							if (folderId === FOLDERS.TRASH) {
								return [...acc, msg];
							}
							// deleted and spam messages are hidden in all folders except trash and spam
							if (
								(msg.parent === FOLDERS.TRASH && folderId !== FOLDERS.TRASH) ||
								(msg.parent === FOLDERS.SPAM && folderId !== FOLDERS.SPAM)
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
		[item?.messages, folderId, messages, sortSign]
	);

	const msgToDisplayCount = useMemo(
		() =>
			// eslint-disable-next-line no-nested-ternary
			folderId === FOLDERS.TRASH
				? item?.messages?.length
				: [FOLDERS.TRASH, FOLDERS.SPAM].includes(folderId)
				? item?.messages?.length
				: filter(item?.messages, (msg) => ![FOLDERS.TRASH, FOLDERS.SPAM].includes(msg.parent))
						?.length,
		[folderId, item?.messages]
	);

	const textReadValues: TextReadValuesProps = useMemo(() => {
		if (typeof item.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read' };
		return item.read
			? { color: 'text', weight: 'regular', badge: 'read' }
			: { color: 'primary', weight: 'bold', badge: 'unread' };
	}, [item.read]);

	const renderBadge = useMemo(() => {
		if (item?.messages?.length === 1) {
			return textReadValues.badge === 'unread';
		}
		return item?.messages?.length > 0;
	}, [item?.messages?.length, textReadValues.badge]);

	return draggedIds?.[item?.id] || visible ? (
		<Drag
			type="conversation"
			data={{ ...item, parentFolderId: folderId, selectedIDs: ids }}
			style={{ display: 'block' }}
			onDragStart={(e): void => dragCheck(e, item.id)}
		>
			<Container mainAlignment="flex-start" data-testid={`ConversationListItem-${item.id}`}>
				<ListItemActionWrapper
					item={item}
					current={active}
					onClick={_onClick}
					onDoubleClick={_onDoubleClick}
					hoverTooltipLabel={participantsString}
					isConversation
					messagesToRender={messagesToRender}
				>
					<div style={{ alignSelf: 'center' }} data-testid={`AvatarContainer`}>
						<ItemAvatar
							item={item}
							selected={selected}
							selecting={selecting}
							toggle={toggle}
							folderId={folderId}
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
										<Badge value={msgToDisplayCount} type={textReadValues.badge} />
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
							folderId={folderId}
						/>
					</CollapseElement>
				)}
			</Container>
		</Drag>
	) : (
		<div style={{ height: '4rem' }} />
	);
};

export default ConversationListItem;
