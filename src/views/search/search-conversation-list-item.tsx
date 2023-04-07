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
	t,
	useTags,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { filter, find, head, includes, isEmpty, noop, reduce, split, uniqBy } from 'lodash';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { searchConv } from '../../store/actions';
import { selectConversationExpandedStatus } from '../../store/conversations-slice';
import { selectMessages } from '../../store/messages-slice';
import {
	ConvMessage,
	IncompleteMessage,
	SearchConversationListItemProps,
	StateType
} from '../../types';
import {
	ConversationMessagesList,
	RowInfo
} from '../app/folder-panel/lists-item/conversation-list-item';
import { ItemAvatar } from '../app/folder-panel/lists-item/item-avatar';
import { ListItemActionWrapper } from '../app/folder-panel/lists-item/list-item-actions-wrapper';
import { SenderName } from '../app/folder-panel/lists-item/sender-name';

const CollapseElement = styled(Container)<ContainerProps & { open: boolean }>`
	display: ${({ open }): string => (open ? 'block' : 'none')};
`;
const SearchConversationListItem: FC<SearchConversationListItemProps> = ({
	itemId,
	item,
	selected,
	selecting = false,
	toggle,
	active
}) => {
	const history = useHistory();
	const dispatch = useAppDispatch();
	const { pathname } = useLocation();
	const parent = useMemo(() => item?.messages[0]?.parent, [item]);
	const messages = useAppSelector(selectMessages);
	const [open, setOpen] = useState(false);
	const settings = useUserSettings();
	const searchInTrash = useMemo(
		() => settings?.prefs?.zimbraPrefIncludeTrashInSearch === 'TRUE',
		[settings]
	);

	const _onClick = useCallback(() => {
		const path = head(split(pathname, '/folder'));
		history.push(`${path}/folder/${parent}/conversation/${item.id}`);
	}, [history, item.id, parent, pathname]);
	const subject = useMemo(
		() => item.subject || t('label.no_subject_with_tags', '<No Subject>'),
		[item.subject]
	);
	const subFragmentTooltipLabel = useMemo(
		() => (!isEmpty(item.fragment) ? `${subject} - ${item.fragment}` : subject),
		[subject, item.fragment]
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
							color: ZIMBRA_STANDARD_COLORS[v.color ?? '0']?.hex
						});
					return acc;
				},
				[]
			),
		[item.tags, tagsFromStore]
	);

	const conversationStatus = useAppSelector((state: StateType) =>
		selectConversationExpandedStatus(state, item.id)
	);

	const toggleExpandButtonLabel = useMemo(
		() => (open ? t('label.hide', 'Hide') : t('label.expand', 'Expand')),
		[open]
	);
	const sortBy = useMemo(
		() => settings?.prefs?.zimbraPrefConversationOrder || 'dateDesc',
		[settings]
	);
	const sortSign = useMemo(() => (sortBy === 'dateDesc' ? -1 : 1), [sortBy]);

	const messagesToRender = useMemo(
		() =>
			uniqBy(
				reduce<ConvMessage, IncompleteMessage[]>(
					item.messages,
					(accumulator, message) => {
						const msg = find(messages, ['id', message.id]);
						if (msg) {
							return [...accumulator, msg];
						}
						return accumulator;
					},
					[]
				).sort((a, b) => (a.date && b.date ? sortSign * (a.date - b.date) : 1)),
				'id'
			),
		[item.messages, messages, sortSign]
	);

	const toggleOpen = useCallback(
		(e) => {
			e.preventDefault();
			setOpen((currentlyOpen) => {
				if (
					!currentlyOpen &&
					conversationStatus !== 'complete' &&
					conversationStatus !== 'pending' &&
					parent
				) {
					dispatch(searchConv({ folderId: parent, conversationId: item.id, fetch: 'all' }));
				}
				return !currentlyOpen;
			});
		},
		[conversationStatus, dispatch, parent, item.id]
	);

	const msgToDisplayCount = useMemo(() => {
		const result = !searchInTrash
			? filter(
					item?.messages,
					(msg) => msg.parent !== FOLDERS.TRASH || msg.parent !== FOLDERS.DRAFT
			  )?.length
			: item?.messages?.length;
		return messagesToRender.length !== 0 ? messagesToRender.length : result;
	}, [item?.messages, messagesToRender.length, searchInTrash]);

	const allMessagesInTrash =
		useMemo(() => filter(item?.messages, (msg) => msg.parent !== FOLDERS.TRASH), [item?.messages])
			.length === 0;

	return !searchInTrash && allMessagesInTrash ? (
		<></>
	) : (
		<Container mainAlignment="flex-start" data-testid={`SearchConversationListItem-${item.id}`}>
			<ListItemActionWrapper item={item} current={active} onClick={_onClick} isConversation>
				<div style={{ alignSelf: 'center' }} data-testid={`AvatarContainer`}>
					<ItemAvatar
						item={item}
						selected={selected}
						selecting={selecting}
						toggle={toggle ?? noop}
						folderId={parent}
						isSearch
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
						<SenderName item={item} isFromSearch />
						<RowInfo item={item} tags={tags} isFromSearch allMessagesInTrash={allMessagesInTrash} />
					</Container>
					<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
						{msgToDisplayCount > 1 && (
							<Row>
								<Padding right="extrasmall">
									<Badge value={msgToDisplayCount} type={item.read ? 'read' : 'unread'} />
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
								{item.subject ? (
									<Text data-testid="Subject" weight={item.read ? 'regular' : 'bold'} size="small">
										{item.subject}
									</Text>
								) : (
									<Text
										data-testid="NoSubject"
										weight={item.read ? 'regular' : 'bold'}
										size="small"
										color="secondary"
									>
										{t('label.no_subject_with_tags', '<No Subject>')}
									</Text>
								)}
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
						active={itemId ?? ''}
						length={item?.messages?.length}
						messages={messagesToRender}
						conversationStatus={conversationStatus}
						folderId={parent}
						isFromSearch
					/>
				</CollapseElement>
			)}
		</Container>
	);
};

export default SearchConversationListItem;
