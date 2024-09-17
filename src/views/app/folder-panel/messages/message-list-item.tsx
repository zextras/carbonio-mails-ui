/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo, ReactElement, ReactNode, useCallback, useMemo } from 'react';

import {
	Badge,
	Button,
	Container,
	ContainerProps,
	Dropdown,
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

import { ZIMBRA_STANDARD_COLORS } from '../../../../carbonio-ui-commons/constants/utils';
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { getTimeLabel, participantToString } from '../../../../commons/utils';
import { EditViewActions } from '../../../../constants';
import { useMsgActions } from '../../../../hooks/actions/use-msg-actions';
import { useAppDispatch } from '../../../../hooks/redux';
import { useMessageActions } from '../../../../hooks/use-message-actions';
import {
	type ItemType,
	MailMessage,
	MessageListItemProps,
	TextReadValuesType,
	UIActionDescriptor
} from '../../../../types';
import { setMsgRead } from '../../../../ui-actions/message-actions';
import { previewMessageOnSeparatedWindow } from '../../../../ui-actions/preview-message-on-separated-window';
import { TagsDropdownItem, useTagExist } from '../../../../ui-actions/tag-actions';
import { getFolderTranslatedName } from '../../../sidebar/utils';
import { createEditBoard } from '../../detail-panel/edit/edit-view-board';
import { useGlobalExtraWindowManager } from '../../extra-windows/global-extra-window-manager';
import { HoverBarContainer } from '../parts/hover-bar-container';
import { HoverContainer } from '../parts/hover-container';
import { ItemAvatar } from '../parts/item-avatar';
import { SenderName } from '../parts/sender-name';

const HoverActionComponent = ({ action }: { action: UIActionDescriptor }): ReactElement => {
	const onClick = useCallback(
		(ev): void => {
			if (ev) {
				ev.preventDefault();
			}
			action.execute();
		},
		[action]
	);
	return (
		<Tooltip label={action.label}>
			<Button
				key={action.id}
				icon={action.icon}
				onClick={onClick}
				size="small"
				type="ghost"
				color="text"
			/>
		</Tooltip>
	);
};

const HoverActionsComponent = ({ message }: { message: MailMessage }): React.JSX.Element => {
	const {
		replyDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		messageReadDescriptor,
		messageUnreadDescriptor,
		flagDescriptor,
		unflagDescriptor
	} = useMsgActions({ message });

	const actions = [
		replyDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		messageReadDescriptor,
		messageUnreadDescriptor,
		flagDescriptor,
		unflagDescriptor
	];

	return (
		<>
			{actions
				.filter((action) => action.canExecute())
				.map((action, index) => (
					<HoverActionComponent key={action.id ?? index} action={action} />
				))}
		</>
	);
};

const normalizeDropdownActionItem = (
	item: UIActionDescriptor
): { id: string; icon: string; label: string; onClick: () => void } => ({
	id: item.id,
	icon: item.icon,
	label: item.label,
	onClick: item.execute
});

const DropdownActionsComponent = ({
	message,
	children
}: {
	message: MailMessage;
	children: React.JSX.Element;
}): React.JSX.Element => {
	const {
		replyDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		sendDraftDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		messageReadDescriptor,
		messageUnreadDescriptor,
		flagDescriptor,
		unflagDescriptor,
		markAsSpamDescriptor,
		markAsNotSpamDescriptor,
		applyTagDescriptor,
		moveToFolderDescriptor,
		restoreFolderDescriptor,
		createAppointmentDescriptor,
		printDescriptor,
		previewOnSeparatedWindowDescriptor,
		redirectDescriptor,
		editDraftDescriptor,
		editAsNewDescriptor,
		showOriginalDescriptor,
		downloadEmlDescriptor
	} = useMsgActions({ message });

	const tagItem = useMemo(
		() => ({
			id: applyTagDescriptor.id,
			icon: applyTagDescriptor.icon,
			label: applyTagDescriptor.label,
			items: reduce(
				applyTagDescriptor.items,
				(acc: Array<ItemType>, descriptor) => {
					if (descriptor.canExecute()) {
						const item = {
							id: descriptor.id,
							label: descriptor.label,
							icon: descriptor.icon,
							keepOpen: true,
							customComponent: (
								<TagsDropdownItem
									checked={includes(message.tags, descriptor.id)}
									actionDescriptor={descriptor}
								/>
							)
						};
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						acc.push(item);
					}
					return acc;
				},
				[]
			)
		}),
		[
			applyTagDescriptor.icon,
			applyTagDescriptor.id,
			applyTagDescriptor.items,
			applyTagDescriptor.label,
			message
		]
	);

	const dropdownMenuItems = useMemo(
		() => [
			normalizeDropdownActionItem(replyDescriptor),
			normalizeDropdownActionItem(replyAllDescriptor),
			normalizeDropdownActionItem(forwardDescriptor),
			normalizeDropdownActionItem(sendDraftDescriptor),
			normalizeDropdownActionItem(moveToTrashDescriptor),
			normalizeDropdownActionItem(deletePermanentlyDescriptor),
			normalizeDropdownActionItem(messageReadDescriptor),
			normalizeDropdownActionItem(messageUnreadDescriptor),
			normalizeDropdownActionItem(flagDescriptor),
			normalizeDropdownActionItem(unflagDescriptor),
			normalizeDropdownActionItem(markAsSpamDescriptor),
			normalizeDropdownActionItem(markAsNotSpamDescriptor),
			tagItem,
			normalizeDropdownActionItem(moveToFolderDescriptor),
			normalizeDropdownActionItem(restoreFolderDescriptor),
			normalizeDropdownActionItem(createAppointmentDescriptor),
			normalizeDropdownActionItem(printDescriptor),
			normalizeDropdownActionItem(previewOnSeparatedWindowDescriptor),
			normalizeDropdownActionItem(redirectDescriptor),
			normalizeDropdownActionItem(editDraftDescriptor),
			normalizeDropdownActionItem(editAsNewDescriptor),
			normalizeDropdownActionItem(showOriginalDescriptor),
			normalizeDropdownActionItem(downloadEmlDescriptor)
		],
		[
			createAppointmentDescriptor,
			deletePermanentlyDescriptor,
			downloadEmlDescriptor,
			editAsNewDescriptor,
			editDraftDescriptor,
			flagDescriptor,
			forwardDescriptor,
			markAsNotSpamDescriptor,
			markAsSpamDescriptor,
			messageReadDescriptor,
			messageUnreadDescriptor,
			moveToFolderDescriptor,
			moveToTrashDescriptor,
			previewOnSeparatedWindowDescriptor,
			printDescriptor,
			redirectDescriptor,
			replyAllDescriptor,
			replyDescriptor,
			restoreFolderDescriptor,
			sendDraftDescriptor,
			showOriginalDescriptor,
			tagItem,
			unflagDescriptor
		]
	);

	return (
		<Dropdown
			contextMenu
			items={dropdownMenuItems}
			display="block"
			style={{ width: '100%', height: '4rem' }}
			data-testid={`secondary-actions-menu-${message.id}`}
		>
			{children}
		</Dropdown>
	);
};
export const MessageListItemActionWrapper = ({
	item,
	active,
	onClick,
	onDoubleClick,
	deselectAll,
	children
}: {
	children?: ReactNode;
	onClick?: ContainerProps['onClick'];
	onDoubleClick?: ContainerProps['onDoubleClick'];
	active?: boolean;
	item: MailMessage;
	deselectAll: () => void;
}): React.JSX.Element => (
	<DropdownActionsComponent message={item}>
		<HoverContainer
			data-testid={`hover-container-${item.id}`}
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
				data-testid={`primary-actions-bar-${item.id}`}
			>
				<HoverActionsComponent message={item} />
			</HoverBarContainer>
		</HoverContainer>
	</DropdownActionsComponent>
);

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

	const dispatch = useAppDispatch();
	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';
	const { createWindow } = useGlobalExtraWindowManager();
	const messageActionsForExtraWindow = useMessageActions({
		message: item,
		isAlone: true,
		isForExtraWindow: true
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
					previewMessageOnSeparatedWindow(
						id,
						firstChildFolderId,
						item.subject,
						createWindow,
						messageActionsForExtraWindow
					).onClick();
				}
			}
		},
		[createWindow, debouncedPushHistory, firstChildFolderId, item, messageActionsForExtraWindow]
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
