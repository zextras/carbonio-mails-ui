/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isEmpty, reduce, trimStart, uniqBy, find, includes, filter, map, noop } from 'lodash';
import styled from 'styled-components';
import {
	pushHistory,
	useUserAccounts,
	FOLDERS,
	useUserSettings,
	useTags,
	ZIMBRA_STANDARD_COLORS,
	Tag
} from '@zextras/carbonio-shell-ui';
import {
	Badge,
	Button,
	Container,
	Icon,
	IconButton,
	Padding,
	Row,
	Text,
	Drag,
	Tooltip,
	List,
	ContainerProps,
	ListProps
} from '@zextras/carbonio-design-system';
import { useDispatch, useSelector } from 'react-redux';

import { selectConversationExpandedStatus } from '../../../../store/conversations-slice';
import { searchConv } from '../../../../store/actions';
import { getTimeLabel, participantToString } from '../../../../commons/utils';
import { ItemAvatar } from './item-avatar';
import { ListItemActionWrapper } from './list-item-actions-wrapper';
import { setConversationsRead } from '../../../../ui-actions/conversation-actions';
import { selectMessages } from '../../../../store/messages-slice';
import { SenderName } from './sender-name';
import MessageListItem from './message-list-item';
import { useTagExist } from '../../../../ui-actions/tag-actions';
import { StateType, Conversation, MailMessage, TextReadValuesProps } from '../../../../types';

type CustomListItem = Partial<MailMessage> & { id: string; isFromSearch?: boolean };

type ConversationMessagesListProps = {
	active: string;
	conversationStatus: string | undefined;
	messages: Array<Partial<MailMessage>>;
	folderId: string;
	length: number;
	isFromSearch?: boolean;
};

const CustomList = styled(List)<ListProps<CustomListItem> & { isFromSearch?: boolean }>``;

export const ConversationMessagesList: FC<ConversationMessagesListProps> = ({
	active,
	conversationStatus,
	messages,
	folderId,
	length,
	isFromSearch
}) => {
	const messagesToRender = useMemo(
		() =>
			map(messages, (item) => ({
				...item,
				id: item.id ?? '',
				...(isFromSearch && { isFromSearch: true })
			})),
		[isFromSearch, messages]
	);
	if (conversationStatus !== 'complete') {
		return (
			<Container height={64 * length}>
				<Button loading disabled label="" type="ghost" onClick={noop} />
			</Container>
		);
	}

	return (
		<CustomList
			style={{ paddingBottom: '4px' }}
			active={active}
			items={messagesToRender}
			isFromSearch={isFromSearch}
			itemProps={{
				folderId,
				isConvChildren: true
			}}
			ItemComponent={MessageListItem}
		/>
	);
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
			{item.attachment && (
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
	itemId: string;
	folderId: string;
	selected?: boolean;
	selecting?: boolean;
	toggle?: () => void;
	active?: boolean;
	visible?: boolean;
	setDraggedIds?: (ids: Record<string, boolean>) => void;
	draggedIds?: Array<string> | undefined;
	setIsDragging?: (isDragging: boolean) => void;
	selectedItems?: Record<string, boolean>;
	dragImageRef?: React.RefObject<HTMLInputElement>;
};

const ConversationListItem: FC<ConversationListItemProps> = ({
	itemId,
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
	const [t] = useTranslation();
	const accounts = useUserAccounts();
	const messages = useSelector(selectMessages);
	const conversationStatus = useSelector((state: StateType) =>
		selectConversationExpandedStatus(state, item.id)
	);
	const tagsFromStore = useTags();
	const tags = useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc: Array<Tag>, v) => {
					if (includes(item.tags, v.id))
						acc.push({
							...v,
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							color: ZIMBRA_STANDARD_COLORS[v.color || 0].hex
						});
					return acc;
				},
				[]
			),
		[item.tags, tagsFromStore]
	);

	const sortBy = useUserSettings()?.prefs?.zimbraPrefConversationOrder || 'dateDesc';

	const participantsString = useMemo(
		() =>
			reduce(
				uniqBy(item.participants, (em) => em.address),
				(acc, part) => trimStart(`${acc}, ${participantToString(part, t, accounts)}`, ', '),
				''
			),
		[item.participants, t, accounts]
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
				if (item?.read === false) {
					setConversationsRead({
						ids: [item.id],
						value: false,
						t,
						dispatch
					}).click();
				}
				pushHistory(`/folder/${folderId}/conversation/${item.id}`);
			}
		},
		[item?.read, item.id, t, dispatch, folderId]
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
		[t, open]
	);
	const subject = useMemo(
		() => item.subject || t('label.no_subject_with_tags', '<No Subject>'),
		[item.subject, t]
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
				reduce(
					item.messages,
					(
						acc: Array<Partial<MailMessage>>,
						v: Partial<MailMessage>
					): Array<Partial<MailMessage>> => {
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
				).sort((a: Partial<MailMessage>, b: Partial<MailMessage>) =>
					a.date && b.date ? sortSign * (a.date - b.date) : 1
				),
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

	return draggedIds?.[parseInt(item?.id, 10)] || visible ? (
		<Drag
			type="conversation"
			data={{ ...item, parentFolderId: folderId, selectedIDs: ids }}
			style={{ display: 'block' }}
			onDragStart={(e): void => dragCheck(e, item.id)}
		>
			<Container
				background={item.read ? 'transparent' : 'gray5'}
				mainAlignment="flex-start"
				data-testid={`ConversationListItem-${item.id}`}
			>
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
							active={itemId}
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
		<div style={{ height: '64px' }} />
	);
};

export default ConversationListItem;
