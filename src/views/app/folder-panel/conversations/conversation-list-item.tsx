/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { memo, ReactNode, useCallback, useMemo, useState } from 'react';

import {
	Badge,
	Container,
	ContainerProps,
	Dropdown,
	Icon,
	IconButton,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { pushHistory, useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce, filter, find, forEach, includes, isEmpty, reduce, uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { ConversationMessagesList } from './conversation-messages-list';
import { ZIMBRA_STANDARD_COLORS } from '../../../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { useTags } from '../../../../carbonio-ui-commons/store/zustand/tags';
import { Tag } from '../../../../carbonio-ui-commons/types/tags';
import { API_REQUEST_STATUS } from '../../../../constants';
import { normalizeDropdownActionItem } from '../../../../helpers/actions';
import { getFolderIdParts } from '../../../../helpers/folders';
import { useConvActions } from '../../../../hooks/actions/use-conv-actions';
import { useConvPreviewOnSeparatedWindowFn } from '../../../../hooks/actions/use-conv-preview-on-separated-window';
import { useConvSetReadFn } from '../../../../hooks/actions/use-conv-set-read';
import { useTagDropdownItem } from '../../../../hooks/use-tag-dropdown-item';
import { retrieveConversation } from '../../../../store/zustand/emails/hooks/hooks';
import { useConversationStatus, useMessagesByIds } from '../../../../store/zustand/emails/store';
import {
	ConvMessage,
	ConversationListItemProps,
	IncompleteMessage,
	TextReadValuesProps,
	NormalizedConversation,
	Conversation
} from '../../../../types';
import { ConversationPreviewPanel } from '../../detail-panel/conversation-preview-panel';
import { HoverBarContainer } from '../parts/hover-bar-container';
import { HoverContainer } from '../parts/hover-container';
import { ItemAvatar } from '../parts/item-avatar';
import { ListItemHoverActions } from '../parts/list-item-hover-actions';
import { RowInfo } from '../parts/row-info';
import { SenderName } from '../parts/sender-name';

const CollapseElement = styled(Container)<{ $open: boolean }>`
	display: ${({ $open }): string => ($open ? 'block' : 'none')};
`;

export const ConversationListItemActionWrapper = ({
	conversation,
	active,
	onClick,
	onDoubleClick,
	deselectAll,
	shouldReplaceHistory,
	children
}: {
	children?: ReactNode;
	onClick?: ContainerProps['onClick'];
	onDoubleClick?: ContainerProps['onDoubleClick'];
	shouldReplaceHistory?: boolean;
	active?: boolean;
	conversation: NormalizedConversation;
	deselectAll: () => void;
}): React.JSX.Element => {
	const conversationPreviewFactory = useCallback(
		() => <ConversationPreviewPanel conversation={conversation} isInsideExtraWindow />,
		[conversation]
	);
	const [t] = useTranslation();
	const {
		replyDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		forwardAsAttachmentDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		setAsReadDescriptor,
		setAsUnreadDescriptor,
		setFlagDescriptor,
		unflagDescriptor,
		markAsSpamDescriptor,
		markAsNotSpamDescriptor,
		applyTagDescriptor,
		moveToFolderDescriptor,
		restoreFolderDescriptor,
		printDescriptor,
		previewOnSeparatedWindowDescriptor,
		showOriginalDescriptor
	} = useConvActions({
		conversation: conversation as Conversation,
		deselectAll,
		conversationPreviewFactory,
		shouldReplaceHistory
	});
	const hoverActions = useMemo(
		() => [
			replyDescriptor,
			replyAllDescriptor,
			forwardDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			setAsReadDescriptor,
			setAsUnreadDescriptor,
			setFlagDescriptor,
			unflagDescriptor,
			restoreFolderDescriptor
		],
		[
			replyDescriptor,
			replyAllDescriptor,
			forwardDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			setAsReadDescriptor,
			setAsUnreadDescriptor,
			setFlagDescriptor,
			unflagDescriptor,
			restoreFolderDescriptor
		]
	);
	const tagItem = useTagDropdownItem(applyTagDescriptor, conversation.tags);
	const dropdownItems = useMemo(
		() =>
			[
				normalizeDropdownActionItem(replyDescriptor),
				normalizeDropdownActionItem(replyAllDescriptor),
				{
					id: 'ForwardMenu',
					icon: 'Forward',
					label: t('action.forward', 'Forward'),
					disabled: !forwardDescriptor.canExecute() && !forwardAsAttachmentDescriptor.canExecute(),
					items: [
						normalizeDropdownActionItem(forwardDescriptor),
						normalizeDropdownActionItem(forwardAsAttachmentDescriptor)
					]
				},
				normalizeDropdownActionItem(moveToTrashDescriptor),
				normalizeDropdownActionItem(deletePermanentlyDescriptor),
				normalizeDropdownActionItem(setAsReadDescriptor),
				normalizeDropdownActionItem(setAsUnreadDescriptor),
				normalizeDropdownActionItem(setFlagDescriptor),
				normalizeDropdownActionItem(unflagDescriptor),
				normalizeDropdownActionItem(markAsSpamDescriptor),
				normalizeDropdownActionItem(markAsNotSpamDescriptor),
				tagItem,
				normalizeDropdownActionItem(moveToFolderDescriptor),
				normalizeDropdownActionItem(restoreFolderDescriptor),
				normalizeDropdownActionItem(printDescriptor),
				normalizeDropdownActionItem(previewOnSeparatedWindowDescriptor),
				normalizeDropdownActionItem(showOriginalDescriptor)
			].filter((action) => !action.disabled),
		[
			replyDescriptor,
			replyAllDescriptor,
			forwardDescriptor,
			forwardAsAttachmentDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			setAsReadDescriptor,
			setAsUnreadDescriptor,
			setFlagDescriptor,
			unflagDescriptor,
			markAsSpamDescriptor,
			markAsNotSpamDescriptor,
			tagItem,
			moveToFolderDescriptor,
			restoreFolderDescriptor,
			printDescriptor,
			previewOnSeparatedWindowDescriptor,
			showOriginalDescriptor,
			t
		]
	);
	return (
		<Dropdown
			contextMenu
			items={dropdownItems}
			display="block"
			style={{ width: '100%', height: '4rem' }}
			data-testid={`secondary-actions-menu-${conversation.id}`}
		>
			<HoverContainer
				data-testid={`hover-container-${conversation.id}`}
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment="unset"
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				$hoverBackground={active ? 'highlight' : 'gray6'}
			>
				{children}
				<HoverBarContainer
					orientation="horizontal"
					mainAlignment="flex-end"
					crossAlignment="center"
					background={active ? 'highlight' : 'gray6'}
					data-testid={`primary-actions-bar-${conversation.id}`}
				>
					<ListItemHoverActions actions={hoverActions} />
				</HoverBarContainer>
			</HoverContainer>
		</Dropdown>
	);
};

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
	const messages = useMessagesByIds(conversation.messages.map((m) => m.id));
	const folderParent = folderId ?? conversation.messages?.[0]?.parent;
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

	const sortBy = useUserSettings()?.prefs?.zimbraPrefConversationOrder || 'dateDesc';
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
					retrieveConversation(conversationId);
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
			const { id, isDraft } = conversation.messages[0];
			if (isDraft) {
				pushHistory(`/folder/${folderParent}/edit/${id}?action=editAsDraft`);
			} else {
				previewOnSeparatedWindow.canExecute() && previewOnSeparatedWindow.execute();
			}
		},

		[debouncedPushHistory, folderParent, conversation.messages, previewOnSeparatedWindow]
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
	const sortSign = useMemo(() => (sortBy === 'dateDesc' ? -1 : 1), [sortBy]);

	// this is the array of all the messages of this conversation to render in this folder
	const messagesToRender = useMemo(
		() =>
			uniqBy(
				reduce<ConvMessage, IncompleteMessage[]>(
					conversation.messages,
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
		[conversation, messages, folderParent, sortSign]
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
		if (conversation?.messages?.length === 1) {
			return textReadValues.badge === 'unread';
		}
		return conversation?.messages?.length > 0;
	}, [conversation?.messages?.length, conversation.messagesInConversation, textReadValues.badge]);

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
						<SenderName item={conversation as Conversation} textValues={textReadValues} />
						<RowInfo item={conversation as Conversation} tags={tags} />
					</Container>
					<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
						{renderBadge && (
							<Row>
								<Padding right="extrasmall">
									<Badge
										data-testid={`conversation-messages-count-${conversation.id}`}
										value={getmsgToDisplayCount()}
										backgroundColor={(textReadValues.badge === 'unread' && 'primary') || 'gray2'}
										color={(textReadValues.badge === 'unread' && 'gray6') || 'gray0'}
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
							<Padding right="extrasmall">
								<Badge
									data-testid={`conversation-messages-count-${conversation.id}`}
									value={getmsgToDisplayCount()}
									type={textReadValues.badge}
								/>
							</Padding>
						</Row>
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
										onClick={toggleOpen}
									/>
								</Tooltip>
							)}
						</Row>
					</Container>
				</Row>
			</ConversationListItemActionWrapper>
			{open && (
				<CollapseElement
					$open={open}
					data-testid="ConversationExpander"
					padding={{ left: 'extralarge' }}
					height="auto"
				>
					<ConversationMessagesList
						active={activeItemId}
						length={conversation.messagesInConversation}
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
});
