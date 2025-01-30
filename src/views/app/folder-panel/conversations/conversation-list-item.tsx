/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { memo, useCallback, useMemo, useState } from 'react';

import {
	Badge,
	Button,
	Container,
	Icon,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { pushHistory, useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce, filter, forEach, includes, isEmpty, reduce, uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { ConversationListItemActionWrapper } from './conversation-list-item-wrapper';
import { ConversationMessagesList } from './conversation-messages-list';
import { ZIMBRA_STANDARD_COLORS } from '../../../../carbonio-ui-commons/constants';
import { useTags } from '../../../../carbonio-ui-commons/store/zustand/tags';
import { Tag } from '../../../../carbonio-ui-commons/types/tags';
import { API_REQUEST_STATUS } from '../../../../constants';
import { useConvPreviewOnSeparatedWindowFn } from '../../../../hooks/actions/use-conv-preview-on-separated-window';
import { useConvSetReadFn } from '../../../../hooks/actions/use-conv-set-read';
import { searchConvEmailStoreAction } from '../../../../store/emails/actions/search-conv-action';
import { useConversationMessages, useConversationStatus } from '../../../../store/emails/store';
import { ConversationListItemProps, TextReadValuesProps } from '../../../../types';
import { ConversationPreviewPanel } from '../../detail-panel/conversation-preview-panel';
import { ItemAvatar } from '../parts/item-avatar';
import { RowInfo } from '../parts/row-info';
import { ParticipantsName } from '../parts/sender-name';

const CollapseElement = styled(Container)<{ $open: boolean }>`
	display: ${({ $open }): string => ($open ? 'block' : 'none')};
`;

export const ConversationListItem = memo(function ConversationListItem({
	conversation,
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
}: ConversationListItemProps): React.JSX.Element {
	const { itemId } = useParams<{ itemId: string }>();
	const [open, setOpen] = useState(false);
	const messages = useConversationMessages(conversation.id);
	const folderParent = folderId ?? messages?.[0]?.parent;
	const [t] = useTranslation();

	const markAsRead = useConvSetReadFn({
		ids: [conversation.id],
		isConversationRead: conversation.read,
		deselectAll,
		folderId: folderId ?? ''
	});

	const conversationPreviewFactory = useCallback(
		() => <ConversationPreviewPanel conversation={conversation} isInsideExtraWindow />,
		[conversation]
	);

	const conversationId = conversation.id;
	const previewOnSeparatedWindow = useConvPreviewOnSeparatedWindowFn({
		conversationId,
		subject: conversation.subject,
		conversationPreviewFactory
	});

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

	const toggleOpen = useCallback(
		(e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent | MouseEvent | KeyboardEvent) => {
			e.preventDefault();
			setOpen((currentlyOpen) => {
				if (
					!currentlyOpen &&
					conversationStatus !== API_REQUEST_STATUS.fulfilled &&
					conversationStatus !== API_REQUEST_STATUS.pending
				) {
					searchConvEmailStoreAction(conversationId);
				}
				return !currentlyOpen;
			});
		},
		[conversationId, conversationStatus]
	);

	const debouncedPushHistory = useMemo(
		() =>
			debounce(() => pushHistory(`/folder/${folderParent}/conversation/${conversation.id}`), 200, {
				leading: false,
				trailing: true
			}),
		[folderParent, conversation.id]
	);

	const _onClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!e.isDefaultPrevented()) {
				if (conversation?.read === false && zimbraPrefMarkMsgRead) {
					markAsRead.canExecute() && markAsRead.execute();
				}
				debouncedPushHistory();
			}
		},
		[conversation?.read, zimbraPrefMarkMsgRead, debouncedPushHistory, markAsRead]
	);

	const _onDoubleClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (e.isDefaultPrevented()) {
				return;
			}
			debouncedPushHistory.cancel();
			const { id, isDraft } = messages[0];
			if (isDraft) {
				pushHistory(`/folder/${folderParent}/edit/${id}?action=editAsDraft`);
			} else {
				previewOnSeparatedWindow.canExecute() && previewOnSeparatedWindow.execute();
			}
		},

		[debouncedPushHistory, messages, folderParent, previewOnSeparatedWindow]
	);

	const toggleExpandButtonLabel = useMemo(
		() => (open ? t('label.hide', 'Hide') : t('label.expand', 'Expand')),
		[open, t]
	);
	const subject = useMemo(
		() => conversation.subject || t('label.no_subject_with_tags', '<No Subject>'),
		[conversation.subject, t]
	);
	const subFragmentTooltipLabel = useMemo(
		() => (!isEmpty(conversation.fragment) ? conversation.fragment : subject),
		[subject, conversation.fragment]
	);

	/**
	 * This is the number of messages to display in the conversation badge.
	 * In search module we check if the user has enabled the option to show trashed and/or spam messages
	 * @returns {number}
	 */
	const getmsgToDisplayCount = useCallback(
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
		if (conversation?.messageIds?.length === 1) {
			return textReadValues.badge === 'unread';
		}
		return conversation?.messageIds?.length > 0;
	}, [conversation?.messageIds?.length, conversation.messagesInConversation, textReadValues.badge]);

	const shouldReplaceHistory = useMemo(() => itemId === conversation.id, [conversation.id, itemId]);

	return (
		<Container mainAlignment="flex-start" data-testid={`ConversationListItem-${conversation.id}`}>
			<ConversationListItemActionWrapper
				conversation={conversation}
				active={active}
				onClick={_onClick}
				onDoubleClick={_onDoubleClick}
				shouldReplaceHistory={shouldReplaceHistory}
				deselectAll={deselectAll}
			>
				<div
					style={{ alignSelf: 'center' }}
					data-testid={`conversation-list-item-avatar-${conversation.id}`}
				>
					<ItemAvatar
						item={conversation}
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
						<ParticipantsName item={conversation} textValues={textReadValues} />
						<RowInfo item={conversation} tags={tags} />
					</Container>
					<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
						{renderBadge && (
							<Row>
								<Padding right="extrasmall">
									<Badge
										data-testid={`conversation-messages-count-${conversation.id}`}
										value={getmsgToDisplayCount()}
										backgroundColor={textReadValues.badge === 'unread' ? 'primary' : 'gray2'}
										color={textReadValues.badge === 'unread' ? 'gray6' : 'gray0'}
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
									<Button
										data-testid="ToggleExpand"
										size="small"
										shape="regular"
										type="default"
										labelColor="text"
										backgroundColor="transparent"
										icon={open ? 'ArrowIosUpward' : 'ArrowIosDownward'}
										onClick={toggleOpen}
									/>
								</Tooltip>
							)}
						</Row>
					</Container>
				</Row>
			</ConversationListItemActionWrapper>
			{open && conversation.messagesInConversation > 1 && (
				<CollapseElement
					$open={open}
					data-testid="ConversationExpander"
					padding={{ left: 'extralarge' }}
					height="auto"
				>
					<ConversationMessagesList
						active={activeItemId}
						length={conversation.messagesInConversation}
						messages={messages}
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
});
