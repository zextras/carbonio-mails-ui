/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import {
	Text,
	Badge,
	Container,
	Icon,
	IconButton,
	Padding,
	Row,
	Tooltip
} from '@zextras/carbonio-design-system';
import { uniqBy, reduce, includes, forEach, filter, isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useTags } from '../../../../carbonio-ui-commons/store/zustand/tags';
import { Tag } from '../../../../carbonio-ui-commons/types/tags';
import { TextReadValuesProps } from '../../../../types';
import { Conversation } from '../../../../types/conversations';
import { ItemAvatar } from '../parts/item-avatar';
import { RowInfo } from '../parts/row-info';
import { SenderName } from '../parts/sender-name';

type ConversationListItemCoreProps = {
	item: Conversation;
	selected: boolean;
	selecting: boolean;
	toggle: (id: string) => void;
	folderParent: string;
	open: boolean;
	toggleOpen: (
		e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent | MouseEvent | KeyboardEvent
	) => void;
};
export const ConversationListItemCore = ({
	item,
	selected,
	selecting,
	toggle,
	folderParent,
	toggleOpen,
	open
}: ConversationListItemCoreProps): React.JSX.Element => {
	const tagsFromStore = useTags();
	const tags = useMemo(
		() =>
			uniqBy(
				reduce(
					tagsFromStore,
					(acc: Array<Tag>, v) => {
						if (includes(item.tags, v.id)) {
							acc.push({
								...v,
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								color: ZIMBRA_STANDARD_COLORS[v.color || 0].hex
							});
						} else if (item.tags?.length > 0 && !includes(item.tags, v.id)) {
							forEach(
								filter(item.tags, (tn) => tn.includes('nil:')),
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
		[item.tags, tagsFromStore]
	);

	const [t] = useTranslation();
	/**
	 * This is the number of messages to display in the conversation badge.
	 * In search module we check if the user has enabled the option to show trashed and/or spam messages
	 * @returns {number}
	 */
	const getmsgToDisplayCount = useCallback((): number => item.messagesInConversation, [item]);

	const textReadValues: TextReadValuesProps = useMemo(() => {
		if (typeof item.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read' };
		return item.read
			? { color: 'text', weight: 'regular', badge: 'read' }
			: { color: 'primary', weight: 'bold', badge: 'unread' };
	}, [item.read]);

	const renderBadge = useMemo(() => {
		if (item.messagesInConversation === 1) return textReadValues.badge === 'unread';
		if (item.messagesInConversation > 0) return true;
		if (item?.messages?.length === 1) {
			return textReadValues.badge === 'unread';
		}
		return item?.messages?.length > 0;
	}, [item?.messages?.length, item.messagesInConversation, textReadValues.badge]);

	const toggleExpandButtonLabel = useMemo(
		() => (open ? t('label.hide', 'Hide') : t('label.expand', 'Expand')),
		[open, t]
	);
	const subject = useMemo(
		() => item.subject || t('label.no_subject_with_tags', '<No Subject>'),
		[item.subject, t]
	);
	const subFragmentTooltipLabel = useMemo(
		() => (!isEmpty(item.fragment) ? item.fragment : subject),
		[subject, item.fragment]
	);
	return (
		<Container mainAlignment="flex-start" data-testid={`ConversationListItem-${item.id}`}>
			<div style={{ alignSelf: 'center' }} data-testid={`conversation-list-item-avatar-${item.id}`}>
				<ItemAvatar
					item={item}
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
					<SenderName item={item} textValues={textReadValues} />
					<RowInfo item={item} tags={tags} />
				</Container>
				<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
					{renderBadge && (
						<Row>
							<Padding right="extrasmall">
								<Badge
									data-testid={`conversation-messages-count-${item.id}`}
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
								color={item.subject ? 'text' : 'secondary'}
							>
								{subject}
							</Text>
						</Row>
					</Tooltip>
					<Row>
						{item.urgent && <Icon data-testid="UrgentIcon" icon="ArrowUpward" color="error" />}
						{item.messagesInConversation > 1 && (
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
		</Container>
	);
};
