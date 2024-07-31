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

import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';
import { participantToString } from '../../../../commons/utils';
import { API_REQUEST_STATUS } from '../../../../constants';
import { useAppDispatch } from '../../../../hooks/redux';
import {
	useConversationById,
	useConversationMessages,
	useConversationStatus
} from '../../../../store/zustand/message-store/store';
import { retrieveConversation } from '../../../../store/zustand/search/hooks/hooks';
import type { Conversation, TextReadValuesProps } from '../../../../types';
import {
	previewConversationOnSeparatedWindowAction,
	setConversationsRead
} from '../../../../ui-actions/conversation-actions';
import { useGlobalExtraWindowManager } from '../../../app/extra-windows/global-extra-window-manager';
import { ConversationMessagesList } from '../../../app/folder-panel/conversations/conversation-messages-list';
import { ItemAvatar } from '../../../app/folder-panel/parts/item-avatar';
import { ListItemActionWrapper } from '../../../app/folder-panel/parts/list-item-actions-wrapper';
import { RowInfo } from '../../../app/folder-panel/parts/row-info';
import { SenderName } from '../../../app/folder-panel/parts/sender-name';

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
		const folderId = conversation.parent;
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
					uniqBy(conversation.participants, (em) => em.address),
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
						retrieveConversation(conversationId, folderId);
					}
					return !currentlyOpen;
				});
			},
			[conversationId, conversationStatus, folderId]
		);

		const _onClick = useCallback(
			(e) => {
				if (!e.isDefaultPrevented()) {
					if (conversation?.read === false && zimbraPrefMarkMsgRead) {
						setConversationsRead({
							ids: [conversationId],
							value: false,
							dispatch,
							folderId,
							deselectAll,
							shouldReplaceHistory: false
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
						}).onClick();
					}
					pushHistory(`/folder/${folderId}/conversation/${conversationId}`);
				}
			},
			[conversation?.read, conversationId, zimbraPrefMarkMsgRead, folderId, dispatch, deselectAll]
		);

		const _onDoubleClick = useCallback(
			(e) => {
				if (e.isDefaultPrevented()) {
					return;
				}

				const { id, isDraft } = conversation.messages[0];
				if (isDraft) {
					pushHistory(`/folder/${folderId}/edit/${id}?action=editAsDraft`);
				} else {
					previewConversationOnSeparatedWindowAction(
						conversationId,
						folderId,
						conversation.subject,
						createWindow
					).onClick();
				}
			},

			[createWindow, folderId, conversationId, conversation.messages, conversation.subject]
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
		return (
			<CustomListItem
				active={active}
				selected={selected}
				key={conversationId}
				background={'transparent'}
			>
				{(visible: boolean): React.JSX.Element => (
					<Container
						mainAlignment="flex-start"
						data-testid={`ConversationListItem-${conversationId}`}
					>
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
									<SenderName item={conversation as Conversation} textValues={textReadValues} />
									<RowInfo item={conversation as Conversation} tags={tags} />
								</Container>
								<Container
									orientation="horizontal"
									height="fit"
									width="fill"
									crossAlignment="center"
								>
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
								<ConversationMessagesList
									active={activeItemId}
									length={conversation.messagesInConversation}
									messages={messages}
									conversationStatus={conversationStatus}
									folderId={folderId}
									isSearchModule
								/>
							</CollapseElement>
						)}
					</Container>
				)}
			</CustomListItem>
		);
	}
);
