/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import {
	Badge,
	Container,
	Icon,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t, useUserAccounts } from '@zextras/carbonio-shell-ui';
import { Tag, useFolder, useTags, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';
import { find, includes, isEmpty, noop, reduce } from 'lodash';
import moment from 'moment/moment';

import { hasAttachments } from '../../../../attachments/attachments';
import { isFocusModeMailView } from '../../../../helpers/external-tabs';
import { getTimeLabel, participantToString } from 'commons/utils';
import { IncompleteMessage, TextReadValuesType } from 'types/index.d';
import { useTagExist } from 'ui-actions/tag-actions';
import { ItemAvatar } from 'views/app/folder-panel/parts/item-avatar';
import { ParticipantsName } from 'views/app/folder-panel/parts/participants-name';
import { getFolderTranslatedName } from 'views/sidebar/utils';

type MessageListItemCoreProps = {
	message: IncompleteMessage;
	selected: boolean;
	selecting: boolean;
	isConvChildren: boolean;
	isSearchModule?: boolean;
	firstChildFolderId: string;
	index: number;
	onSelect: (index: number, id: string, event: React.MouseEvent) => void;
};

export const MessageListItemCore = ({
	message,
	selected,
	selecting,
	isConvChildren,
	isSearchModule,
	firstChildFolderId,
	index,
	onSelect
}: MessageListItemCoreProps): React.JSX.Element => {
	const accounts = useUserAccounts();
	const tagsFromStore = useTags();
	const messageFolder = useFolder(message.parent);
	const [date] = useMemo(() => {
		if (message) {
			const sender = find(message.participants, ['type', 'f']);
			return [getTimeLabel(message.date), participantToString(sender, accounts)];
		}
		return ['.', '.', '', ''];
	}, [message, accounts]);

	const [showIcon, icon, iconTooltip, iconId, color] = useMemo(() => {
		if (!message) return [false, '', '', '', ''];
		if (message.isSentByMe && !message.isDraft && !message.isReplied && !message.isForwarded) {
			return [true, 'PaperPlaneOutline', t('label.sent', 'Sent'), 'SentIcon', 'secondary'];
		}
		if (message.isDraft) {
			return [true, 'FileOutline', t('label.draft', 'Draft'), 'DraftIcon', 'secondary'];
		}
		if (message.isReplied) {
			return [true, 'UndoOutline', t('label.replied', 'Replied'), 'RepliedIcon', 'secondary'];
		}
		if (
			!message.read &&
			!message.isReplied &&
			!message.isDraft &&
			!message.isSentByMe &&
			!message.isForwarded
		) {
			return [true, 'EmailOutline', t('search.unread', 'Unread'), 'UnreadIcon', 'primary'];
		}
		if (
			message.read &&
			!message.isReplied &&
			!message.isDraft &&
			!message.isSentByMe &&
			!message.isForwarded
		) {
			return [true, 'EmailReadOutline', t('label.read', 'Read'), 'ReadIcon', 'secondary'];
		}
		if (message.isForwarded) {
			return [true, 'Forward', t('label.forwarded', 'Forwarded'), 'ForwardedIcon', 'secondary'];
		}
		return [false, '', '', '', ''];
	}, [message]);
	const tags = useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc, v) => {
					if (includes(message.tags, v.id))
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						acc.push({ ...v, color: ZIMBRA_STANDARD_COLORS[v.color ?? '0'].hex });
					return acc;
				},
				[] as Array<Tag & { color: string }>
			),
		[message.tags, tagsFromStore]
	);

	const fragmentLabel = useMemo(
		() => (isConvChildren ? message.fragment : ` - ${message.fragment}`),
		[message.fragment, isConvChildren]
	);
	const textReadValues = useMemo<TextReadValuesType>(() => {
		if (typeof message.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read' };
		return message.read
			? { color: 'text', weight: 'regular', badge: 'read' }
			: { color: 'primary', weight: 'bold', badge: 'unread' };
	}, [message.read]);
	const isTagInStore = useTagExist(tags);
	const showTagIcon = useMemo(
		() => message.tags && message.tags.length !== 0 && message.tags?.[0] !== '' && isTagInStore,
		[isTagInStore, message.tags]
	);
	const tagIcon = useMemo(() => (tags.length > 1 ? 'TagsMoreOutline' : 'Tag'), [tags]);
	const tagIconColor = useMemo(() => (tags.length === 1 ? tags[0].color : undefined), [tags]);
	const subject = useMemo(
		() => message.subject || t('label.no_subject_with_tags', '<No Subject>'),
		[message.subject]
	);
	const subFragmentTooltipLabel = useMemo(
		() => (!isEmpty(message.fragment) ? message.fragment : subject),
		[subject, message.fragment]
	);

	const scheduledTime = useMemo(
		() =>
			t('message.schedule_time', {
				date: moment(message?.autoSendTime).format('DD/MM/YYYY'),
				time: moment(message?.autoSendTime).format('HH:mm'),
				defaultValue: 'for {{date}} at {{time}}'
			}),
		[message?.autoSendTime]
	);
	const onSelectCallback = useMemo(
		() => (isConvChildren ? noop : onSelect),
		[isConvChildren, onSelect]
	);

	return (
		<Container mainAlignment="flex-start" orientation="horizontal" height={'4rem'}>
			<div style={{ alignSelf: 'center' }} data-testid={`message-list-item-avatar-${message.id}`}>
				<ItemAvatar
					item={message}
					selected={selected}
					selecting={selecting}
					index={index}
					onSelect={onSelectCallback}
					folderId={firstChildFolderId}
				/>
				<Padding horizontal="extrasmall" />
			</div>
			<Row
				wrap="wrap"
				orientation="horizontal"
				takeAvailableSpace
				padding={{ left: 'small', top: 'small', bottom: 'small', right: 'large' }}
			>
				<Container orientation="horizontal" height="fit" width="fill">
					<ParticipantsName
						item={message}
						textValues={textReadValues}
						isSearchModule={isSearchModule}
					/>
					<Row>
						{showTagIcon && (
							<Padding left="small">
								<Icon data-testid="TagIcon" icon={tagIcon} color={tagIconColor} />
							</Padding>
						)}
						{hasAttachments(message) && (
							<Padding left="small">
								<Icon data-testid="AttachmentIcon" icon="AttachOutline" />
							</Padding>
						)}
						{message.flagged && (
							<Padding left="small">
								<Icon data-testid="FlagIcon" color="error" icon="Flag" />
							</Padding>
						)}
						<Padding left="small">
							{message?.isScheduled ? (
								<Row>
									<Padding right="extrasmall">
										<Icon data-testid={iconId} icon="SendDelayedOutline" color="primary" />
									</Padding>
									<Text data-testid="DelayedMailLabel" size="extrasmall" color="primary">
										{t('label.send_scheduled', 'Send Scheduled')}
									</Text>
								</Row>
							) : (
								<Text data-testid="DateLabel" size="extrasmall">
									{date}
								</Text>
							)}
						</Padding>
					</Row>
				</Container>
				<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
					<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start" crossAlignment="center">
						{showIcon && (
							<Tooltip label={iconTooltip} placement="bottom">
								<Padding right="extrasmall">
									<Icon data-testid={iconId} icon={icon} color={color} />
								</Padding>
							</Tooltip>
						)}
						<Tooltip label={subFragmentTooltipLabel} overflow="break-word" maxWidth="60vw">
							<Row
								wrap="nowrap"
								takeAvailableSpace
								mainAlignment="flex-start"
								crossAlignment="baseline"
							>
								{!isConvChildren && (
									<Text
										data-testid="Subject"
										weight={textReadValues.weight}
										color={message.subject ? 'text' : 'secondary'}
									>
										{subject}
									</Text>
								)}

								{!isEmpty(message.fragment) && (
									<Row
										takeAvailableSpace
										mainAlignment="flex-start"
										padding={{ left: 'extrasmall' }}
									>
										<Text
											data-testid="Fragment"
											size="small"
											color="secondary"
											weight={textReadValues.weight}
										>
											{fragmentLabel}
										</Text>
									</Row>
								)}
							</Row>
						</Tooltip>
					</Row>
					<Row>
						{message.urgent && (
							<Padding left="extrasmall">
								<Icon data-testid="UrgentIcon" icon="ArrowUpward" color="error" />
							</Padding>
						)}

						{message?.isScheduled && (
							<Tooltip label={scheduledTime}>
								<Text data-testid="DelayedMailLabel" size="extrasmall" color="primary">
									{scheduledTime}
								</Text>
							</Tooltip>
						)}
						{((messageFolder && messageFolder.id !== firstChildFolderId) ||
							isSearchModule ||
							isFocusModeMailView()) && (
							<Padding left="small">
								<Badge
									data-testid="FolderBadge"
									value={getFolderTranslatedName({
										folderId: firstChildFolderId,
										folderName: messageFolder?.name ?? ''
									})}
									backgroundColor={textReadValues.badge === 'unread' ? 'primary' : 'gray2'}
									color={textReadValues.badge === 'unread' ? 'gray6' : 'gray0'}
								/>
							</Padding>
						)}
					</Row>
				</Container>
			</Row>
		</Container>
	);
};
