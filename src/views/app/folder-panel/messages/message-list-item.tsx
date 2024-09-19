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
import { debounce, find, includes, isEmpty, noop, reduce } from 'lodash';
import moment from 'moment';
import { useParams } from 'react-router-dom';

import { MessageListItemActionWrapper } from './message-list-item-action-wrapper';
import { ZIMBRA_STANDARD_COLORS } from '../../../../carbonio-ui-commons/constants';
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { getTimeLabel, participantToString } from '../../../../commons/utils';
import { EditViewActions } from '../../../../constants';
import { useMsgPreviewOnSeparatedWindowFn } from '../../../../hooks/actions/use-msg-preview-on-separated-window';
import { useAppDispatch } from '../../../../hooks/redux';
import { MessageListItemProps, TextReadValuesType } from '../../../../types';
import { setMsgRead } from '../../../../ui-actions/message-actions';
import { useTagExist } from '../../../../ui-actions/tag-actions';
import { getFolderTranslatedName } from '../../../sidebar/utils';
import { createEditBoard } from '../../detail-panel/edit/edit-view-board';
import { MessagePreviewPanel } from '../../detail-panel/message-preview-panel';
import { ItemAvatar } from '../parts/item-avatar';
import { SenderName } from '../parts/sender-name';

type RouteParams = {
	itemId: string;
};
export const MessageListItem: FC<MessageListItemProps> = memo(function MessageListItem({
	item,
	selected,
	selecting,
	toggle,
	isConvChildren,
	active,
	isSearchModule,
	deselectAll,
	currentFolderId,
	handleReplaceHistory
}) {
	const firstChildFolderId = currentFolderId ?? item.parent;
	const { itemId } = useParams<RouteParams>();
	const shouldReplaceHistory = useMemo(() => itemId === item.id, [item.id, itemId]);
	const dispatch = useAppDispatch();
	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const messagePreviewFactory = useCallback(
		() => <MessagePreviewPanel folderId={firstChildFolderId} messageId={item.id} />,
		[firstChildFolderId, item.id]
	);

	const { execute } = useMsgPreviewOnSeparatedWindowFn({
		messageId: item.id,
		subject: item.subject,
		messagePreviewFactory
	});

	const debouncedPushHistory = useMemo(
		() =>
			debounce(() => replaceHistory(`/folder/${firstChildFolderId}/message/${item.id}`), 200, {
				leading: false,
				trailing: true
			}),
		[firstChildFolderId, item.id]
	);

	const onClick = useCallback(
		(e) => {
			if (!e.isDefaultPrevented()) {
				if (item.read === false && zimbraPrefMarkMsgRead) {
					setMsgRead({ ids: [item.id], value: false, dispatch }).onClick(e);
				}
				if (handleReplaceHistory) {
					handleReplaceHistory();
				} else {
					debouncedPushHistory();
				}
			}
		},
		[
			item.read,
			item.id,
			zimbraPrefMarkMsgRead,
			handleReplaceHistory,
			dispatch,
			debouncedPushHistory
		]
	);
	const onDoubleClick = useCallback(
		(e) => {
			if (!e.isDefaultPrevented()) {
				debouncedPushHistory.cancel();
				const { id, isDraft } = item;
				if (isDraft) {
					createEditBoard({
						action: EditViewActions.EDIT_AS_DRAFT,
						actionTargetId: id
					});
				} else {
					execute();
				}
			}
		},
		[debouncedPushHistory, execute, item]
	);

	const accounts = useUserAccounts();
	const tagsFromStore = useTags();
	const messageFolder = useFolder(item.parent);
	const [date] = useMemo(() => {
		if (item) {
			const sender = find(item.participants, ['type', 'f']);
			return [getTimeLabel(item.date), participantToString(sender, accounts)];
		}
		return ['.', '.', '', ''];
	}, [item, accounts]);

	const [showIcon, icon, iconTooltip, iconId, color] = useMemo(() => {
		if (!item) return [false, '', '', '', ''];
		if (item.isSentByMe && !item.isDraft && !item.isReplied && !item.isForwarded) {
			return [true, 'PaperPlaneOutline', t('label.sent', 'Sent'), 'SentIcon', 'secondary'];
		}
		if (item.isDraft) {
			return [true, 'FileOutline', t('label.draft', 'Draft'), 'DraftIcon', 'secondary'];
		}
		if (item.isReplied) {
			return [true, 'UndoOutline', t('label.replied', 'Replied'), 'RepliedIcon', 'secondary'];
		}
		if (
			item.read === false &&
			!item.isReplied &&
			!item.isDraft &&
			!item.isSentByMe &&
			!item.isForwarded
		) {
			return [true, 'EmailOutline', t('search.unread', 'Unread'), 'UnreadIcon', 'primary'];
		}
		if (
			item.read !== false &&
			!item.isReplied &&
			!item.isDraft &&
			!item.isSentByMe &&
			!item.isForwarded
		) {
			return [true, 'EmailReadOutline', t('label.read', 'Read'), 'ReadIcon', 'secondary'];
		}
		if (item.isForwarded) {
			return [true, 'Forward', t('label.forwarded', 'Forwarded'), 'ForwardedIcon', 'secondary'];
		}
		return [false, '', '', '', ''];
	}, [item]);

	const tags = useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc, v) => {
					if (includes(item.tags, v.id))
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						acc.push({ ...v, color: ZIMBRA_STANDARD_COLORS[v.color ?? '0'].hex });
					return acc;
				},
				[] as Array<Tag & { color: string }>
			),
		[item.tags, tagsFromStore]
	);

	const fragmentLabel = useMemo(
		() => (isConvChildren ? item.fragment : ` - ${item.fragment}`),
		[item.fragment, isConvChildren]
	);
	const textReadValues = useMemo<TextReadValuesType>(() => {
		if (typeof item.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read' };
		return item.read
			? { color: 'text', weight: 'regular', badge: 'read' }
			: { color: 'primary', weight: 'bold', badge: 'unread' };
	}, [item.read]);

	const isTagInStore = useTagExist(tags);
	const showTagIcon = useMemo(
		() => item.tags && item.tags.length !== 0 && item.tags?.[0] !== '' && isTagInStore,
		[isTagInStore, item.tags]
	);
	const tagIcon = useMemo(() => (tags.length > 1 ? 'TagsMoreOutline' : 'Tag'), [tags]);
	const tagIconColor = useMemo(() => (tags.length === 1 ? tags[0].color : undefined), [tags]);
	const subject = useMemo(
		() => item.subject || t('label.no_subject_with_tags', '<No Subject>'),
		[item.subject]
	);
	const subFragmentTooltipLabel = useMemo(
		() => (!isEmpty(item.fragment) ? item.fragment : subject),
		[subject, item.fragment]
	);

	const scheduledTime = useMemo(
		() =>
			t('message.schedule_time', {
				date: moment(item?.autoSendTime).format('DD/MM/YYYY'),
				time: moment(item?.autoSendTime).format('HH:mm'),
				defaultValue: 'for {{date}} at {{time}}'
			}),
		[item?.autoSendTime]
	);

	const onToggle = useMemo(() => (isConvChildren ? noop : toggle), [isConvChildren, toggle]);

	return (
		<Container mainAlignment="flex-start" data-testid={`MessageListItem-${item.id}`}>
			<MessageListItemActionWrapper
				item={item}
				active={active}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				shouldReplaceHistory={shouldReplaceHistory}
				deselectAll={deselectAll}
			>
				<div style={{ alignSelf: 'center' }} data-testid={`message-list-item-avatar-${item.id}`}>
					<ItemAvatar
						item={item}
						selected={selected}
						selecting={selecting}
						toggle={onToggle}
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
						<SenderName item={item} textValues={textReadValues} isSearchModule={isSearchModule} />
						<Row>
							{showTagIcon && (
								<Padding left="small">
									<Icon data-testid="TagIcon" icon={tagIcon} color={tagIconColor} />
								</Padding>
							)}
							{item.hasAttachment && (
								<Padding left="small">
									<Icon data-testid="AttachmentIcon" icon="AttachOutline" />
								</Padding>
							)}
							{item.flagged && (
								<Padding left="small">
									<Icon data-testid="FlagIcon" color="error" icon="Flag" />
								</Padding>
							)}
							<Padding left="small">
								{item?.isScheduled ? (
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
											color={item.subject ? 'text' : 'secondary'}
										>
											{subject}
										</Text>
									)}

									{!isEmpty(item.fragment) && (
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
							{item.urgent && (
								<Padding left="extrasmall">
									<Icon data-testid="UrgentIcon" icon="ArrowUpward" color="error" />
								</Padding>
							)}

							{item?.isScheduled && (
								<Tooltip label={scheduledTime}>
									<Text data-testid="DelayedMailLabel" size="extrasmall" color="primary">
										{scheduledTime}
									</Text>
								</Tooltip>
							)}
							{((messageFolder && messageFolder.id !== firstChildFolderId) || isSearchModule) && (
								<Padding left="small">
									<Badge
										data-testid="FolderBadge"
										value={getFolderTranslatedName({
											folderId: firstChildFolderId,
											folderName: messageFolder?.name ?? ''
										})}
										type={textReadValues.badge}
									/>
								</Padding>
							)}
						</Row>
					</Container>
				</Row>
			</MessageListItemActionWrapper>
		</Container>
	);
});
