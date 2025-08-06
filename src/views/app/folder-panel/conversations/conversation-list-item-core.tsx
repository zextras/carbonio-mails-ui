/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

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
import { Tag, useTags, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';
import { filter, forEach, includes, isEmpty, reduce, uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';

import { NormalizedConversation, TextReadValuesProps } from 'types/index.d';
import { ItemAvatar } from 'views/app/folder-panel/parts/item-avatar';
import { ParticipantsName } from 'views/app/folder-panel/parts/participants-name';
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

function cleanSubject(subject: string): string {
	return subject.replace(/^(RE:|FWD:)\s*/i, '').trim();
}

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
								color: ZIMBRA_STANDARD_COLORS[v.color ?? 0].hex
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

	const textReadValues: TextReadValuesProps = useMemo(() => {
		if (typeof conversation.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read' };
		return conversation.read
			? { color: 'text', weight: 'regular', badge: 'read' }
			: { color: 'primary', weight: 'bold', badge: 'unread' };
	}, [conversation.read]);

	const renderBadge = useMemo(() => {
		if (conversation.messagesInConversation === 1 || conversation?.messageIds?.length === 1)
			return textReadValues.badge === 'unread';
		return conversation.messagesInConversation > 0 || conversation?.messageIds?.length > 0;
	}, [conversation?.messageIds?.length, conversation.messagesInConversation, textReadValues.badge]);

	const toggleExpandButtonLabel = useMemo(
		() => (open ? t('label.hide', 'Hide') : t('label.expand', 'Expand')),
		[open, t]
	);
	const subject = useMemo(
		() => cleanSubject(conversation.subject) || t('label.no_subject_with_tags', '<No Subject>'),
		[conversation.subject, t]
	);
	const subFragmentTooltipLabel = useMemo(
		() => (!isEmpty(conversation.fragment) ? conversation.fragment : subject),
		[subject, conversation.fragment]
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
					id={conversation.id}
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
