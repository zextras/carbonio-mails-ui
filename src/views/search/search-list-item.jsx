/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isEmpty, split, head, includes, reduce, uniqBy, find } from 'lodash';
import {
	Badge,
	Container,
	Icon,
	IconButton,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTags, useUserSettings, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';
import ListItemActionWrapper from '../app/folder-panel/lists-item/list-item-actions-wrapper';
import { ItemAvatar } from '../app/folder-panel/lists-item/item-avatar';
import {
	ConversationMessagesList,
	RowInfo
} from '../app/folder-panel/lists-item/conversation-list-item';
import { SenderName } from '../app/folder-panel/lists-item/sender-name';
import { selectMessages } from '../../store/messages-slice';
import { selectConversationExpandedStatus } from '../../store/conversations-slice';
import { searchConv } from '../../store/actions';

const CollapseElement = styled(Container)`
	display: ${({ open }) => (open ? 'block' : 'none')};
`;

const SearchListItem = ({ itemId, item, folderId, selected, selecting, toggle, active }) => {
	const [t] = useTranslation();
	const history = useHistory();
	const dispatch = useDispatch();
	const { pathname } = useLocation();
	const parent = item?.messages[0]?.parent;
	const messages = useSelector(selectMessages);
	const [open, setOpen] = useState(false);
	const _onClick = useCallback(() => {
		const path = head(split(pathname, '/folder'));
		dispatch({
			type: 'conversations/setCurrentFolder',
			payload: parent
		});
		history.push(`${path}/folder/${parent}/conversation/${item.id}`);
	}, [dispatch, history, item, parent, pathname]);
	const subject = useMemo(
		() => item.subject || t('label.no_subject_with_tags', '<No Subject>'),
		[item.subject, t]
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
				(acc, v) => {
					if (includes(item.tags, v.id))
						acc.push({ ...v, color: ZIMBRA_STANDARD_COLORS[parseInt(v.color ?? '0', 10)].hex });
					return acc;
				},
				[]
			),
		[item.tags, tagsFromStore]
	);

	const conversationStatus = useSelector((state) =>
		selectConversationExpandedStatus(state, item.id)
	);

	const toggleExpandButtonLabel = useMemo(
		() => (open ? t('label.hide', 'Hide') : t('label.expand', 'Expand')),
		[t, open]
	);
	const sortBy = useUserSettings()?.prefs?.zimbraPrefConversationOrder || 'dateDesc';
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
							// all other messages are valid and must be showed in the conversation
							return [...acc, msg];
						}
						return acc;
					},
					[]
				).sort((a, b) => sortSign * (a.date - b.date)),
				'id'
			),
		[item?.messages, messages, sortSign]
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
	return (
		<Container
			background={active ? 'highlight' : 'gray6'}
			mainAlignment="flex-start"
			data-testid={`ConversationListItem-${item.id}`}
		>
			<ListItemActionWrapper item={item} current={active} onClick={_onClick} isConversation>
				<div style={{ alignSelf: 'center' }} data-testid={`AvatarContainer`}>
					<ItemAvatar
						item={item}
						selected={selected}
						selecting={selecting}
						toggle={toggle}
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
						<RowInfo item={item} tags={tags} />
					</Container>
					<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
						{item.msgCount > 1 && (
							<Row>
								<Padding right="extrasmall">
									<Badge value={item.msgCount} type={item.read ? 'read' : 'unread'} />
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
						active={itemId}
						length={item?.messages?.length}
						messages={messagesToRender}
						conversationStatus={conversationStatus}
						folderId={parent}
					/>
				</CollapseElement>
			)}
		</Container>
	);
};

export default SearchListItem;
