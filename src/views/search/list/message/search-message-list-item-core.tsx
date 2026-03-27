/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Container, Icon, Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useUserAccounts } from '@zextras/carbonio-shell-ui';
import { Tag, useFolder, useTags, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';
import { find, includes, reduce } from 'lodash';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import { ItemBadge } from '../../../app/folder-panel/parts/item-badge';
import { MessageSubjectRow } from '../../../app/folder-panel/parts/message-subject-row';
import { ParticipantsString } from '../../../app/folder-panel/parts/participants-string';
import { getTimeLabel, participantToString } from 'commons/utils';
import { MailMessage } from 'types/messages';
import { useTagExist } from 'ui-actions/tag-actions';
import { ItemAvatar } from 'views/app/folder-panel/parts/item-avatar';
import { getFolderTranslatedName } from 'views/sidebar/utils';

type SearchMessageListItemCoreProps = {
	completeMessage: MailMessage;
	selected: boolean;
	selecting: boolean;
	index: number;
	onSelect: (index: number, id: string, event: React.MouseEvent) => void;
	folderId: string;
};
export const SearchMessageListItemCore = ({
	completeMessage,
	selected,
	selecting,
	index,
	onSelect,
	folderId
}: SearchMessageListItemCoreProps): React.JSX.Element => {
	const [t] = useTranslation();
	const tagsFromStore = useTags();
	const messageFolder = useFolder(completeMessage.parent);

	const accounts = useUserAccounts();
	const [date] = useMemo(() => {
		if (completeMessage) {
			const sender = find(completeMessage.participants, ['type', 'f']);
			return [getTimeLabel(completeMessage.date), participantToString(sender, accounts)];
		}
		return ['.', '.', '', ''];
	}, [completeMessage, accounts]);

	const [showIcon, icon, iconTooltip, iconId, color] = useMemo(() => {
		if (!completeMessage) return [false, '', '', '', ''];
		if (
			completeMessage.isSentByMe &&
			!completeMessage.isDraft &&
			!completeMessage.isReplied &&
			!completeMessage.isForwarded
		) {
			return [true, 'PaperPlaneOutline', t('label.sent', 'Sent'), 'SentIcon', 'secondary'];
		}
		if (completeMessage.isDraft) {
			return [true, 'FileOutline', t('label.draft', 'Draft'), 'DraftIcon', 'secondary'];
		}
		if (completeMessage.isReplied) {
			return [true, 'UndoOutline', t('label.replied', 'Replied'), 'RepliedIcon', 'secondary'];
		}
		if (
			!completeMessage.read &&
			!completeMessage.isReplied &&
			!completeMessage.isDraft &&
			!completeMessage.isSentByMe &&
			!completeMessage.isForwarded
		) {
			return [true, 'EmailOutline', t('search.unread', 'Unread'), 'UnreadIcon', 'primary'];
		}
		if (
			completeMessage.read &&
			!completeMessage.isReplied &&
			!completeMessage.isDraft &&
			!completeMessage.isSentByMe &&
			!completeMessage.isForwarded
		) {
			return [true, 'EmailReadOutline', t('label.read', 'Read'), 'ReadIcon', 'secondary'];
		}
		if (completeMessage.isForwarded) {
			return [true, 'Forward', t('label.forwarded', 'Forwarded'), 'ForwardedIcon', 'secondary'];
		}
		return [false, '', '', '', ''];
	}, [completeMessage, t]);

	const tags = useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc, v) => {
					if (includes(completeMessage.tags, v.id))
						acc.push({
							...v,
							// casting type to avoid tsignore
							color: ZIMBRA_STANDARD_COLORS[v.color ?? '0'].hex as unknown as number
						});
					return acc;
				},
				[] as Array<Tag>
			),
		[completeMessage.tags, tagsFromStore]
	);

	const isTagInStore = useTagExist(tags);
	const showTagIcon = useMemo(
		() =>
			completeMessage.tags &&
			completeMessage.tags.length !== 0 &&
			completeMessage.tags?.[0] !== '' &&
			isTagInStore,
		[isTagInStore, completeMessage.tags]
	);
	const tagIcon = useMemo(() => (tags.length > 1 ? 'TagsMoreOutline' : 'Tag'), [tags]);
	const tagIconColor = useMemo(() => (tags.length === 1 ? tags[0].color : undefined), [tags]);

	const scheduledTime = useMemo(
		() =>
			t('message.schedule_time', {
				date: moment(completeMessage?.autoSendTime).format('DD/MM/YYYY'),
				time: moment(completeMessage?.autoSendTime).format('HH:mm'),
				defaultValue: 'for {{date}} at {{time}}'
			}),
		[completeMessage?.autoSendTime, t]
	);

	return (
		<Container mainAlignment="flex-start" orientation="horizontal" height={'4rem'}>
			<div
				style={{ alignSelf: 'center' }}
				data-testid={`message-list-item-avatar-${completeMessage.id}`}
			>
				<ItemAvatar
					item={completeMessage}
					selected={selected}
					selecting={selecting}
					folderId={folderId}
					index={index}
					onSelect={onSelect}
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
					<ParticipantsString item={completeMessage} />
					<Row>
						{showTagIcon && (
							<Padding left="small">
								<Icon
									data-testid="TagIcon"
									icon={tagIcon}
									color={tagIconColor as unknown as string}
								/>
							</Padding>
						)}
						{completeMessage.hasAttachment && (
							<Padding left="small">
								<Icon data-testid="AttachmentIcon" icon="AttachOutline" />
							</Padding>
						)}
						{completeMessage.flagged && (
							<Padding left="small">
								<Icon data-testid="FlagIcon" color="error" icon="Flag" />
							</Padding>
						)}
						<Padding left="small">
							{completeMessage?.isScheduled ? (
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
						<MessageSubjectRow
							subject={completeMessage.subject}
							read={completeMessage.read}
							fragment={completeMessage.fragment}
						/>
					</Row>
					<Row>
						{completeMessage.urgent && (
							<Padding left="extrasmall">
								<Icon data-testid="UrgentIcon" icon="ArrowUpward" color="error" />
							</Padding>
						)}

						{completeMessage?.isScheduled && (
							<Tooltip label={scheduledTime}>
								<Text data-testid="DelayedMailLabel" size="extrasmall" color="primary">
									{scheduledTime}
								</Text>
							</Tooltip>
						)}
						<Padding left="small">
							<ItemBadge
								value={getFolderTranslatedName({
									folderId,
									folderName: messageFolder?.name ?? ''
								})}
								itemReadValue={completeMessage.read}
							/>
						</Padding>
					</Row>
				</Container>
			</Row>
		</Container>
	);
};
