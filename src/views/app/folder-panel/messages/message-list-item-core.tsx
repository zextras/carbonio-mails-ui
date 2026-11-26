/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { Container, Icon, Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { t, useUserAccounts } from '@zextras/carbonio-shell-ui';
import { TAG_PILLS_CHILD_ROW_MAX_BUDGET, useFolder } from '@zextras/carbonio-ui-commons';
import { find, noop } from 'lodash';
import moment from 'moment/moment';

import { isFocusModeMailView } from '../../../../helpers/external-tabs';
import { ItemBadge } from '../parts/item-badge';
import { LineWithTags } from '../parts/line-with-tags';
import { MessageSubjectRow } from '../parts/message-subject-row';
import { ParticipantsString } from '../parts/participants-string';
import { getTimeLabel, participantToString } from 'commons/utils';
import { IncompleteMessage } from 'types/messages';
import { TagTarget } from 'views/app/detail-panel/preview/parts/tags/use-reading-pane-tags';
import { ItemAvatar } from 'views/app/folder-panel/parts/item-avatar';
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
	const messageFolder = useFolder(message.parent);
	const folderIds = useMemo(() => [message.parent], [message.parent]);
	const tagTarget = useMemo<TagTarget>(
		() => ({ kind: 'message', id: message.id, folderId: message.parent }),
		[message.id, message.parent]
	);
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
					{isConvChildren ? (
						<LineWithTags
							target={tagTarget}
							tagIds={message.tags}
							folderIds={folderIds}
							maxBudget={TAG_PILLS_CHILD_ROW_MAX_BUDGET}
						>
							<ParticipantsString item={message} />
						</LineWithTags>
					) : (
						<ParticipantsString item={message} />
					)}
					<Row>
						{message.hasAttachment && (
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
					<LineWithTags
						target={tagTarget}
						tagIds={isConvChildren ? undefined : message.tags}
						folderIds={folderIds}
					>
						{showIcon && (
							<Tooltip label={iconTooltip} placement="bottom">
								<Padding right="extrasmall">
									<Icon data-testid={iconId} icon={icon} color={color} />
								</Padding>
							</Tooltip>
						)}
						<MessageSubjectRow
							subject={message.subject}
							read={message.read}
							fragment={message.fragment}
							isConvChildren={isConvChildren}
						/>
					</LineWithTags>
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
								<ItemBadge
									itemReadValue={message.read}
									value={getFolderTranslatedName({
										folderId: firstChildFolderId,
										folderName: messageFolder?.name ?? ''
									})}
								/>
							</Padding>
						)}
					</Row>
				</Container>
			</Row>
		</Container>
	);
};
