/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { Button, Container, Icon, Padding, Row, Tooltip } from '@zextras/carbonio-design-system';
import { Tag, useTags, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';
import { filter, forEach, includes, reduce, uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';

import { ConversationSubjectRow } from '../../../app/folder-panel/parts/conversation-subject-row';
import { ItemBadge } from '../../../app/folder-panel/parts/item-badge';
import { ParticipantsString } from '../../../app/folder-panel/parts/participants-string';
import { NormalizedConversation } from 'types/conversations';
import { ItemAvatar } from 'views/app/folder-panel/parts/item-avatar';
import { RowInfo } from 'views/app/folder-panel/parts/row-info';

type SearchConversationListItemCoreProps = {
	conversation: NormalizedConversation;
	selected: boolean;
	selecting: boolean;
	open: boolean;
	toggleCollapseElementCallback: (
		e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent | MouseEvent | KeyboardEvent
	) => void;
	parent: string;
	index: number;
	onSelect: (index: number, id: string, event: React.MouseEvent) => void;
};
export const SearchConversationListItemCore = ({
	conversation,
	selected,
	selecting,
	open,
	toggleCollapseElementCallback,
	parent,
	index,
	onSelect
}: SearchConversationListItemCoreProps): React.JSX.Element => {
	const [t] = useTranslation();

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
								// casting type to avoid tsignore
								color: ZIMBRA_STANDARD_COLORS[v.color ?? 0].hex as unknown as number
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

	const conversationId = conversation.id;

	const toggleExpandButtonLabel = useMemo(
		() => (open ? t('label.hide', 'Hide') : t('label.expand', 'Expand')),
		[open, t]
	);
	const badgeTotalConversationMessages = useCallback(
		(): number => conversation.messagesInConversation,
		[conversation]
	);

	const badge: 'read' | 'unread' = useMemo(() => {
		if (conversation.read === undefined) return 'read';
		return conversation.read ? 'read' : 'unread';
	}, [conversation.read]);

	const renderBadge = useMemo(() => {
		if (conversation.messagesInConversation === 1 || conversation?.messageIds?.length === 1) {
			return badge === 'unread';
		}
		return conversation.messagesInConversation > 0 || conversation?.messageIds?.length > 0;
	}, [conversation?.messageIds?.length, conversation.messagesInConversation, badge]);

	const avatarFolderId = conversation.messageIds.length === 1 ? parent : '';

	return (
		<Container mainAlignment="flex-start" orientation="horizontal" height={'4rem'}>
			<div
				style={{ alignSelf: 'center' }}
				data-testid={`conversation-list-item-avatar-${conversationId}`}
			>
				<ItemAvatar
					item={conversation}
					selected={selected}
					selecting={selecting}
					folderId={avatarFolderId}
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
					<RowInfo item={conversation} tags={tags} />
				</Container>
				<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
					{renderBadge && (
						<Row>
							<Padding right="extrasmall">
								<ItemBadge
									itemReadValue={conversation.read}
									value={badgeTotalConversationMessages()}
								/>
							</Padding>
						</Row>
					)}
					<ConversationSubjectRow
						subject={conversation.subject}
						read={conversation.read}
						fragment={conversation.fragment}
					/>
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
									onClick={toggleCollapseElementCallback}
								/>
							</Tooltip>
						)}
					</Row>
				</Container>
			</Row>
		</Container>
	);
};
