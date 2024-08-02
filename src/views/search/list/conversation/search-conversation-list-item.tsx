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
	ZIMBRA_STANDARD_COLORS,
	pushHistory,
	t,
	useTags,
	useUserAccounts,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { filter, forEach, includes, isEmpty, reduce, trimStart, uniqBy } from 'lodash';
import styled from 'styled-components';

import { SearchConversationMessagesList } from './search-conversation-messages-list';
import { participantToString } from '../../../../commons/utils';
import { API_REQUEST_STATUS } from '../../../../constants';
import { useAppDispatch } from '../../../../hooks/redux';
import {
	useConversationById,
	useConversationMessages,
	useConversationStatus
} from '../../../../store/zustand/message-store/store';
import { retrieveConversation } from '../../../../store/zustand/search/hooks/hooks';
import type { Conversation, Participant, TextReadValuesProps } from '../../../../types';
import { setConversationsReadWithCallback } from '../../../../ui-actions/conversation-actions';
import { useGlobalExtraWindowManager } from '../../../app/extra-windows/global-extra-window-manager';
import { ItemAvatar } from '../../../app/folder-panel/parts/item-avatar';
import { ListItemActionWrapper } from '../../../app/folder-panel/parts/list-item-actions-wrapper';
import { RowInfo } from '../../../app/folder-panel/parts/row-info';
import { SenderName } from '../../../app/folder-panel/parts/sender-name';
import { previewConversationOnSeparatedWindowAction } from '../../preview/search-preview-actions';

const CollapseElement = styled(Container)<ContainerProps & { open: boolean }>`
	display: ${({ open }): string => (open ? 'block' : 'none')};
`;
type SearchConversationListItemProps = {
	conversationId: string;
	selecting: boolean;
	active: boolean;
	activeItemId: string;
	toggle: (id: string) => void;
	selected: boolean;
	deselectAll: () => void;
};

export const SearchConversationListItem: FC<SearchConversationListItemProps> = memo(
	function ConversationListItem({
		conversationId,
		selecting,
		active,
		activeItemId,
		toggle,
		selected,
		deselectAll
	}) {
		const conversation = useConversationById(conversationId);
		const dispatch = useAppDispatch();
		const [open, setOpen] = useState(false);
		const accounts = useUserAccounts();
		const messages = useConversationMessages(conversationId);
		const { createWindow } = useGlobalExtraWindowManager();
		const conversationStatus = useConversationStatus(conversationId);
		const tagsFromStore = useTags();
		const tags = useMemo(
			() =>
				uniqBy(
					reduce(
						tagsFromStore,
						(acc: Array<Tag>, v) => {
							if (includes(conversation.tags, v.id)) {
								acc.push({
									...v,
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									color: ZIMBRA_STANDARD_COLORS[v.color || 0].hex
								});
							} else if (conversation.tags?.length > 0 && !includes(conversation.tags, v.id)) {
								forEach(
									filter(conversation.tags, (tn) => tn.includes('nil:')),
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
			[conversation.tags, tagsFromStore]
		);

		const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';
		const participantsString = useMemo(
			() =>
				reduce(
					uniqBy(conversation.participants, (em: Participant) => em.address),
					(acc, part) => trimStart(`${acc}, ${participantToString(part, accounts)}`, ', '),
					''
				),
			[conversation.participants, accounts]
		);

		const expandConversation = useCallback(
			(e) => {
				e.preventDefault();
				setOpen((currentlyOpen) => {
					if (
						!currentlyOpen &&
						conversationStatus !== API_REQUEST_STATUS.fulfilled &&
						conversationStatus !== API_REQUEST_STATUS.pending
					) {
						retrieveConversation(conversationId);
					}
					return !currentlyOpen;
				});
			},
			[conversationId, conversationStatus]
		);

		const _onClick = useCallback(
			(e) => {
				if (!e.isDefaultPrevented()) {
					if (conversation?.read === false && zimbraPrefMarkMsgRead) {
						setConversationsReadWithCallback({
							ids: [conversationId],
							value: false,
							dispatch,
							deselectAll
						}).onClick();
					}
					pushHistory(`conversation/${conversationId}`);
				}
			},
			[conversation?.read, conversationId, zimbraPrefMarkMsgRead, dispatch, deselectAll]
		);

		const _onDoubleClick = useCallback(
			(e) => {
				if (e.isDefaultPrevented()) {
					return;
				}

				const { id, isDraft, parent } = conversation.messages[0];
				if (isDraft) {
					pushHistory(`/folder/${parent}/edit/${id}?action=editAsDraft`);
				} else {
					previewConversationOnSeparatedWindowAction(
						conversationId,
						conversation.subject,
						createWindow
					).onClick();
				}
			},

			[createWindow, conversationId, conversation.messages, conversation.subject]
		);

		const toggleExpandButtonLabel = useMemo(
			() => (open ? t('label.hide', 'Hide') : t('label.expand', 'Expand')),
			[open]
		);
		const subject = useMemo(
			() => conversation.subject || t('label.no_subject_with_tags', '<No Subject>'),
			[conversation.subject]
		);
		const subFragmentTooltipLabel = useMemo(
			() => (!isEmpty(conversation.fragment) ? conversation.fragment : subject),
			[subject, conversation.fragment]
		);

		const badgeTotalConversationMessages = useCallback(
			(): number => conversation.messagesInConversation,
			[conversation]
		);

		const textReadValues: TextReadValuesProps = useMemo(() => {
			if (typeof conversation.read === 'undefined')
				return { color: 'text', weight: 'regular', badge: 'read' };
			return conversation.read
				? { color: 'text', weight: 'regular', badge: 'read' }
				: { color: 'primary', weight: 'bold', badge: 'unread' };
		}, [conversation.read]);

		const renderBadge = useMemo(() => {
			if (conversation.messagesInConversation === 1) return textReadValues.badge === 'unread';
			if (conversation.messagesInConversation > 0) return true;
			if (conversation?.messages?.length === 1) {
				return textReadValues.badge === 'unread';
			}
			return conversation?.messages?.length > 0;
		}, [conversation?.messages?.length, conversation.messagesInConversation, textReadValues.badge]);

		const avatarFolderId =
			conversation.messages.length === 1 ? conversation.messages[0].parent : '';
		return (
			<Container mainAlignment="flex-start" data-testid={`ConversationListItem-${conversationId}`}>
				<ListItemActionWrapper
					item={conversation as Conversation}
					active={active}
					onClick={_onClick}
					onDoubleClick={_onDoubleClick}
					hoverTooltipLabel={participantsString}
					deselectAll={deselectAll}
				>
					<div
						style={{ alignSelf: 'center' }}
						data-testid={`conversation-list-item-avatar-${conversationId}`}
					>
						<ItemAvatar
							item={conversation}
							selected={selected}
							selecting={selecting}
							toggle={toggle}
							folderId={avatarFolderId}
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
							<SenderName item={conversation as Conversation} textValues={textReadValues} />
							<RowInfo item={conversation as Conversation} tags={tags} />
						</Container>
						<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
							{renderBadge && (
								<Row>
									<Padding right="extrasmall">
										<Badge
											data-testid={`conversation-messages-count-${conversationId}`}
											value={badgeTotalConversationMessages()}
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
										color={conversation.subject ? 'text' : 'secondary'}
									>
										{subject}
									</Text>
								</Row>
							</Tooltip>
							<Row>
								{conversation.urgent && (
									<Icon data-testid="UrgentIcon" icon="ArrowUpward" color="error" />
								)}
								{conversation.messagesInConversation > 1 && (
									<Tooltip label={toggleExpandButtonLabel}>
										<IconButton
											data-testid="ToggleExpand"
											size="small"
											icon={open ? 'ArrowIosUpward' : 'ArrowIosDownward'}
											onClick={expandConversation}
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
						<SearchConversationMessagesList
							active={activeItemId}
							length={conversation.messagesInConversation}
							messages={messages}
							conversationStatus={conversationStatus}
						/>
					</CollapseElement>
				)}
			</Container>
		);
	}
);
