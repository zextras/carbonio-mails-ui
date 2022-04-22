/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isEmpty, reduce, trimStart, map, uniqBy, find, includes, every } from 'lodash';
import styled from 'styled-components';
import {
	pushHistory,
	useUserAccounts,
	FOLDERS,
	useUserSettings,
	useTags,
	ZIMBRA_STANDARD_COLORS
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
	Tooltip
} from '@zextras/carbonio-design-system';
import { useDispatch, useSelector } from 'react-redux';

import { selectConversationExpandedStatus } from '../../../../store/conversations-slice';
import { searchConv } from '../../../../store/actions';
import { getTimeLabel, participantToString } from '../../../../commons/utils';
import { ItemAvatar } from './item-avatar';
import ListItemActionWrapper from './list-item-actions-wrapper';
import { setConversationsRead } from '../../../../ui-actions/conversation-actions';
import { selectMessages } from '../../../../store/messages-slice';
import { SenderName } from './sender-name';
import MessageListItem from './message-list-item';
import { useTagExist } from '../../../../ui-actions/tag-actions';

function ConversationMessagesList({ conversationStatus, messages, folderId }) {
	if (conversationStatus !== 'complete') {
		return (
			<Container height={64 * messages.length}>
				<Button loading disabled label="" type="ghost" />
			</Container>
		);
	}

	return (
		<>
			{map(messages, (msg, index) => (
				<React.Fragment key={msg.id}>
					<MessageListItem
						item={msg}
						conversationId={msg.parent}
						folderId={folderId}
						isConvChildren
					/>
				</React.Fragment>
			))}
		</>
	);
}

const CollapseElement = styled(Container)`
	display: ${({ open }) => (open ? 'block' : 'none')};
`;

export const RowInfo = ({ item, tags }) => {
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
			{showTagIcon && (
				<Padding left="small">
					<Icon data-testid="TagIcon" icon={tagIcon} color={tagIconColor} />
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

export default function ConversationListItem({
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
}) {
	const dispatch = useDispatch();
	const [open, setOpen] = useState(false);
	const [t] = useTranslation();
	const accounts = useUserAccounts();
	const messages = useSelector(selectMessages);
	const conversationStatus = useSelector((state) =>
		selectConversationExpandedStatus(state, item.id)
	);
	const tagsFromStore = useTags();
	const tags = useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc, v) => {
					if (includes(item.tags, v.id))
						acc.push({ ...v, color: ZIMBRA_STANDARD_COLORS[parseInt(v.color ?? '0', 10)].hex });
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
			setIsDragging(true);
			e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
			if (selectedItems[id]) {
				setDraggedIds(selectedItems);
			} else {
				setDraggedIds({ [id]: true });
			}
		},
		[setIsDragging, dragImageRef, selectedItems, setDraggedIds]
	);

	const toggleExpandButtonLabel = useMemo(
		() => (open ? t('label.hide', 'Hide') : t('label.expand', 'Expand')),
		[t, open]
	);
	const subject = useMemo(
		() => item.subject || t('label.no_subject', 'No subject'),
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
				).sort((a, b) => sortSign * (a.date - b.date)),
				'id'
			),
		[item?.messages, folderId, messages, sortSign]
	);

	const textReadValues = useMemo(() => {
		if (typeof item.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read' };
		return item.read
			? { color: 'text', weight: 'regular', badge: 'read' }
			: { color: 'primary', weight: 'bold', badge: 'unread' };
	}, [item.read]);

	const renderBadge = useMemo(() => {
		if (messagesToRender?.length === 1) {
			return textReadValues.badge === 'unread';
		}
		return messagesToRender?.length > 0;
	}, [messagesToRender?.length, textReadValues.badge]);

	if (messagesToRender?.length < 1) return null;
	return draggedIds?.[item?.id] || visible ? (
		<Drag
			type="conversation"
			data={{ ...item, parentFolderId: folderId, selectedIDs: ids }}
			style={{ display: 'block' }}
			onDragStart={(e) => dragCheck(e, item.id)}
		>
			<Container
				// eslint-disable-next-line no-nested-ternary
				background={active ? 'highlight' : item.read ? 'gray6' : 'gray5'}
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
							<SenderName item={item} textValues={textReadValues} isFromSearch={false} />
							<RowInfo item={item} tags={tags} />
						</Container>
						<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
							{renderBadge && (
								<Row>
									<Padding right="extrasmall">
										<Badge value={messagesToRender.length} type={textReadValues.badge} />
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
									<Text data-testid="Subject" weight={textReadValues.weight} color="text">
										{subject}
									</Text>

									{!isEmpty(item.fragment) && (
										<Row
											takeAvailableSpace
											mainAlignment="flex-start"
											padding={{ left: 'extrasmall' }}
										>
											<Text
												data-testid="Fragment"
												size="small"
												color="secondary"
											>{` - ${item.fragment}`}</Text>
										</Row>
									)}
								</Row>
							</Tooltip>
							<Row>
								{item.urgent && <Icon data-testid="UrgentIcon" icon="ArrowUpward" color="error" />}
								{messagesToRender.length > 1 && (
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
}
