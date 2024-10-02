/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo, useCallback, useMemo } from 'react';

import {
	Badge,
	Container,
	Icon,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import {
	Tag,
	replaceHistory,
	t,
	useTags,
	useUserAccounts,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { find, includes, isEmpty, noop, reduce } from 'lodash';
import moment from 'moment';
import { useParams } from 'react-router-dom';

import { ZIMBRA_STANDARD_COLORS } from '../../../../carbonio-ui-commons/constants';
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { getTimeLabel, participantToString } from '../../../../commons/utils';
import { EditViewActions } from '../../../../constants';
import { useMsgPreviewOnSeparatedWindowFn } from '../../../../hooks/actions/use-msg-preview-on-separated-window';
import { useMsgSetReadFn } from '../../../../hooks/actions/use-msg-set-read';
import { useMessageById } from '../../../../store/zustand/search/store';
import { TextReadValuesType } from '../../../../types';
import { useTagExist } from '../../../../ui-actions/tag-actions';
import { createEditBoard } from '../../../app/detail-panel/edit/edit-view-board';
import { MessagePreviewPanel } from '../../../app/detail-panel/message-preview-panel';
import { MessageListItemActionWrapper } from '../../../app/folder-panel/messages/message-list-item-action-wrapper';
import { ItemAvatar } from '../../../app/folder-panel/parts/item-avatar';
import { SenderName } from '../../../app/folder-panel/parts/sender-name';
import { getFolderTranslatedName } from '../../../sidebar/utils';

type SearchMessageListItemProps = {
	itemId: string;
	selected: boolean;
	selecting: boolean;
	toggle: (id: string) => void;
	isConvChildren: boolean;
	active?: boolean;
	isSearchModule?: boolean;
	isConversation?: boolean;
	deselectAll: () => void;
};
export const SearchMessageListItem: FC<SearchMessageListItemProps> = memo(function MessageListItem({
	itemId,
	selected,
	selecting,
	toggle,
	isConvChildren,
	active,
	isSearchModule,
	deselectAll
}) {
	const completeMessage = useMessageById(itemId);
	const folderId = completeMessage.parent;
	const { itemId: messageId } = useParams<{ itemId: string }>();

	const shouldReplaceHistory = useMemo(() => itemId === messageId, [messageId, itemId]);

	const messagePreviewFactory = useCallback(
		() => <MessagePreviewPanel folderId={folderId} messageId={itemId} />,
		[folderId, itemId]
	);

	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const previewOnSeparatedWindow = useMsgPreviewOnSeparatedWindowFn({
		messageId: itemId,
		subject: completeMessage.subject,
		messagePreviewFactory
	});

	const setAsRead = useMsgSetReadFn({
		ids: [itemId],
		shouldReplaceHistory,
		isMessageRead: completeMessage.read,
		deselectAll,
		folderId
	});

	const onClick = useCallback(
		(e) => {
			if (e.isDefaultPrevented()) {
				return;
			}
			if (completeMessage.read === false && zimbraPrefMarkMsgRead) {
				setAsRead.canExecute() && setAsRead.execute();
			}
			replaceHistory(`/message/${completeMessage.id}`);
		},
		[completeMessage.read, completeMessage.id, zimbraPrefMarkMsgRead, setAsRead]
	);
	const onDoubleClick = useCallback(
		(e) => {
			if (e.isDefaultPrevented()) {
				return;
			}
			const { id, isDraft } = completeMessage;
			if (isDraft) {
				createEditBoard({
					action: EditViewActions.EDIT_AS_DRAFT,
					actionTargetId: id
				});
				return;
			}
			previewOnSeparatedWindow.canExecute() && previewOnSeparatedWindow.execute();
		},
		[previewOnSeparatedWindow, completeMessage]
	);

	const accounts = useUserAccounts();
	const tagsFromStore = useTags();
	const messageFolder = useFolder(completeMessage.parent);
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
			completeMessage.read === false &&
			!completeMessage.isReplied &&
			!completeMessage.isDraft &&
			!completeMessage.isSentByMe &&
			!completeMessage.isForwarded
		) {
			return [true, 'EmailOutline', t('search.unread', 'Unread'), 'UnreadIcon', 'primary'];
		}
		if (
			completeMessage.read !== false &&
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
	}, [completeMessage]);

	const tags = useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc, v) => {
					if (includes(completeMessage.tags, v.id))
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						acc.push({ ...v, color: ZIMBRA_STANDARD_COLORS[v.color ?? '0'].hex });
					return acc;
				},
				[] as Array<Tag & { color: string }>
			),
		[completeMessage.tags, tagsFromStore]
	);

	const fragmentLabel = useMemo(
		() => (isConvChildren ? completeMessage.fragment : ` - ${completeMessage.fragment}`),
		[completeMessage.fragment, isConvChildren]
	);
	const textReadValues = useMemo<TextReadValuesType>(() => {
		if (typeof completeMessage.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read' };
		return completeMessage.read
			? { color: 'text', weight: 'regular', badge: 'read' }
			: { color: 'primary', weight: 'bold', badge: 'unread' };
	}, [completeMessage.read]);

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
	const subject = useMemo(
		() => completeMessage.subject || t('label.no_subject_with_tags', '<No Subject>'),
		[completeMessage.subject]
	);
	const subFragmentTooltipLabel = useMemo(
		() => (!isEmpty(completeMessage.fragment) ? completeMessage.fragment : subject),
		[subject, completeMessage.fragment]
	);

	const scheduledTime = useMemo(
		() =>
			t('message.schedule_time', {
				date: moment(completeMessage?.autoSendTime).format('DD/MM/YYYY'),
				time: moment(completeMessage?.autoSendTime).format('HH:mm'),
				defaultValue: 'for {{date}} at {{time}}'
			}),
		[completeMessage?.autoSendTime]
	);

	const onToggle = useMemo(() => (isConvChildren ? noop : toggle), [isConvChildren, toggle]);

	return (
		<Container mainAlignment="flex-start" data-testid={`MessageListItem-${completeMessage.id}`}>
			<MessageListItemActionWrapper
				item={completeMessage}
				active={active}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				deselectAll={deselectAll}
				shouldReplaceHistory={shouldReplaceHistory}
			>
				<div
					style={{ alignSelf: 'center' }}
					data-testid={`message-list-item-avatar-${completeMessage.id}`}
				>
					<ItemAvatar
						item={completeMessage}
						selected={selected}
						selecting={selecting}
						toggle={onToggle}
						folderId={folderId}
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
						<SenderName
							item={completeMessage}
							textValues={textReadValues}
							isSearchModule={isSearchModule}
						/>
						<Row>
							{showTagIcon && (
								<Padding left="small">
									<Icon data-testid="TagIcon" icon={tagIcon} color={tagIconColor} />
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
						<Row
							wrap="nowrap"
							takeAvailableSpace
							mainAlignment="flex-start"
							crossAlignment="center"
						>
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
											color={completeMessage.subject ? 'text' : 'secondary'}
										>
											{subject}
										</Text>
									)}

									{!isEmpty(completeMessage.fragment) && (
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
								<Badge
									data-testid="FolderBadge"
									value={getFolderTranslatedName({
										folderId,
										folderName: messageFolder?.name ?? ''
									})}
									backgroundColor={textReadValues.badge === 'read' ? 'gray2' : 'primary'}
									color={textReadValues.badge === 'read' ? 'gray0' : 'gray6'}
								/>
							</Padding>
						</Row>
					</Container>
				</Row>
			</MessageListItemActionWrapper>
		</Container>
	);
});
