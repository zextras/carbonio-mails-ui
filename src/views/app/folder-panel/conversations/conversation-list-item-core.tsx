/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { Button, Container, Icon, Padding, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { ConversationBadge } from '../parts/conversation-badge';
import { ConversationSubjectRow } from '../parts/conversation-subject-row';
import { LineWithTags, ROW_END_PADDING } from '../parts/line-with-tags';
import { ParticipantsString } from '../parts/participants-string';
import { hasSharedTag, useConversationFolderIds } from 'hooks/use-tag-pill-items';
import { NormalizedConversation } from 'types/conversations';
import { TagTarget } from 'views/app/detail-panel/preview/parts/tags/use-reading-pane-tags';
import { ItemAvatar } from 'views/app/folder-panel/parts/item-avatar';
import { RowInfo } from 'views/app/folder-panel/parts/row-info';

type ConversationListItemCoreProps = {
	conversation: NormalizedConversation;
	selected: boolean;
	selecting: boolean;
	folderParent: string;
	open: boolean;
	toggleCollapseElementCallback: (
		e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent | MouseEvent | KeyboardEvent
	) => void;
	index: number;
	onSelect: (index: number, id: string, event: React.MouseEvent) => void;
};

export const ConversationListItemCore = ({
	conversation,
	selected,
	selecting,
	folderParent,
	toggleCollapseElementCallback,
	open,
	index,
	onSelect
}: ConversationListItemCoreProps): React.JSX.Element => {
	const [t] = useTranslation();
	/**
	 * This is the number of messages to display in the conversation badge.
	 * In search module we check if the user has enabled the option to show trashed and/or spam messages
	 * @returns {number}
	 */
	const getmsgToDisplayCount = useCallback(
		(): number => conversation.messagesInConversation,
		[conversation]
	);

	const showToggle = conversation.messagesInConversation > 1;
	const badge: 'read' | 'unread' = useMemo(() => {
		if (conversation.read === undefined) return 'read';
		return conversation.read ? 'read' : 'unread';
	}, [conversation.read]);

	const renderBadge = useMemo(() => {
		if (conversation.messagesInConversation === 1 || conversation?.messageIds?.length === 1)
			return badge === 'unread';
		return conversation.messagesInConversation > 0 || conversation?.messageIds?.length > 0;
	}, [conversation?.messageIds?.length, conversation.messagesInConversation, badge]);

	const folderIds = useConversationFolderIds(conversation.id, hasSharedTag(conversation.tags));
	const tagTarget = useMemo<TagTarget>(
		() => ({ kind: 'conversation', id: conversation.id, folderId: folderParent }),
		[conversation.id, folderParent]
	);

	const toggleExpandButtonLabel = useMemo(
		() => (open ? t('label.hide', 'Hide') : t('label.expand', 'Expand')),
		[open, t]
	);

	return (
		<Container mainAlignment="flex-start" orientation="horizontal" height={'4rem'}>
			<div
				style={{ alignSelf: 'center' }}
				data-testid={`conversation-list-item-avatar-${conversation.id}`}
			>
				<ItemAvatar
					item={conversation}
					selected={selected}
					selecting={selecting}
					folderId={folderParent}
					index={index}
					onSelect={onSelect}
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
					<ParticipantsString item={conversation} />
					<RowInfo item={conversation} />
				</Container>
				<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
					{renderBadge && (
						<Row>
							<Padding right="extrasmall">
								<ConversationBadge
									messages={getmsgToDisplayCount()}
									read={conversation.read}
									unread={conversation.unreadCount}
								/>
							</Padding>
						</Row>
					)}
					<LineWithTags target={tagTarget} tagIds={conversation.tags} folderIds={folderIds}>
						<ConversationSubjectRow
							subject={conversation.subject}
							read={conversation.read}
							fragment={conversation.fragment}
						/>
					</LineWithTags>
					<Row
						data-testid="conversation-row-end"
						padding={showToggle && !conversation.urgent ? ROW_END_PADDING : undefined}
					>
						{conversation.urgent && (
							<Icon data-testid="UrgentIcon" icon="ArrowUpward" color="error" />
						)}
						{showToggle && (
							<Tooltip label={toggleExpandButtonLabel}>
								<Button
									data-testid="ToggleExpand"
									size="small"
									shape="regular"
									type="default"
									labelColor="text"
									backgroundColor="transparent"
									icon={open ? 'ArrowIosUpward' : 'ArrowIosDownward'}
									onClick={toggleCollapseElementCallback}
									aria-label={toggleExpandButtonLabel}
								/>
							</Tooltip>
						)}
					</Row>
				</Container>
			</Row>
		</Container>
	);
};
