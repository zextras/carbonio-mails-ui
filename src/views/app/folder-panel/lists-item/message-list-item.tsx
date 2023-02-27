/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Badge,
	Container,
	Drag,
	Icon,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import {
	addBoard,
	FOLDERS,
	replaceHistory,
	t,
	Tag,
	useAppContext,
	useFolder,
	useTags,
	useUserAccounts,
	useUserSettings,
	ZIMBRA_STANDARD_COLORS
} from '@zextras/carbonio-shell-ui';
import { find, includes, isEmpty, reduce } from 'lodash';
import moment from 'moment';
import React, { FC, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { ActionsType, getTimeLabel, participantToString } from '../../../../commons/utils';
import { MAILS_ROUTE } from '../../../../constants';

import {
	AppContext,
	MessageListItemProps,
	MsgListDraggableItemType,
	TextReadValuesType
} from '../../../../types';
import { setMsgRead } from '../../../../ui-actions/message-actions';
import { useTagExist } from '../../../../ui-actions/tag-actions';
import { ItemAvatar } from './item-avatar';
import { ListItemActionWrapper } from './list-item-actions-wrapper';
import { SenderName } from './sender-name';

type Preview = {
	src?: string | null | ArrayBuffer;
};

function previewFile(file: File): void {
	const preview = document.querySelector('img') as Preview;
	const reader = new FileReader();

	reader.addEventListener(
		'load',
		// eslint-disable-next-line func-names
		function () {
			// convert image file to base64 string
			preview.src = reader.result;
		},
		false
	);

	if (file) {
		reader.readAsDataURL(file);
	}
}

const DraggableItem: FC<MsgListDraggableItemType> = ({
	item,
	folderId,
	children,
	isMessageView,
	dragCheck,
	selectedIds
}) =>
	isMessageView ? (
		<Drag
			type="message"
			data={{ ...item, parentFolderId: folderId, selectedIDs: selectedIds }}
			style={{ display: 'block' }}
			onDragStart={(e): void => dragCheck(e, item.id)}
		>
			{children}
		</Drag>
	) : (
		<>{children}</>
	);

export const MessageListItem: FC<MessageListItemProps> = ({
	item,
	folderId,
	selected,
	selecting,
	toggle = (): null => null,
	draggedIds,
	setDraggedIds,
	setIsDragging,
	selectedItems,
	dragImageRef,
	visible,
	isConvChildren,
	active
}) => {
	const accounts = useUserAccounts();
	const { isMessageView } = useAppContext<AppContext>();
	const messageFolder = useFolder(item.parent);
	const ids = useMemo(() => Object.keys(selectedItems ?? []), [selectedItems]);
	const dispatch = useDispatch();
	const tagsFromStore = useTags();
	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const tags = useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc, v) => {
					if (includes(item.tags, v.id))
						// TODO fix color type
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						acc.push({ ...v, color: ZIMBRA_STANDARD_COLORS[v.color ?? '0'].hex });
					return acc;
				},
				[] as Array<Tag & { color: string }>
			),
		[item.tags, tagsFromStore]
	);

	const [date] = useMemo(() => {
		if (item) {
			const sender = find(item.participants, ['type', 'f']);
			return [getTimeLabel(item.date), participantToString(sender, accounts)];
		}
		return ['.', '.', '', ''];
	}, [item, accounts]);

	const [showIcon, icon, iconTooltip, iconId, color] = useMemo(() => {
		if (item) {
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
		}
		return [false, '', '', '', ''];
	}, [item]);

	const _onClick = useCallback(
		(e) => {
			if (!e.isDefaultPrevented()) {
				if (item.read === false && zimbraPrefMarkMsgRead) {
					setMsgRead({ ids: [item.id], value: false, dispatch }).click();
				}
				replaceHistory(`/folder/${folderId}/message/${item.id}`);
			}
		},
		[item.read, item.id, zimbraPrefMarkMsgRead, folderId, dispatch]
	);
	const _onDoubleClick = useCallback(
		(e) => {
			if (!e.isDefaultPrevented()) {
				const { id, isDraft } = item;
				if (isDraft) {
					addBoard({
						url: `${MAILS_ROUTE}/edit/${id}?action=${ActionsType.EDIT_AS_DRAFT}`,
						context: { mailId: id, folderId },
						title: ''
					});
				}
			}
		},
		[folderId, item]
	);

	const dragCheck = useCallback(
		(e: React.DragEvent, id: string) => {
			setIsDragging(true);
			if (dragImageRef?.current) {
				e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
			}
			if (selectedItems[id]) {
				setDraggedIds(selectedItems);
			} else {
				setDraggedIds({ [id]: true });
			}
		},
		[setIsDragging, dragImageRef, selectedItems, setDraggedIds]
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

	return draggedIds?.[item?.id] || visible || isConvChildren ? (
		<Drag
			type="message"
			data={{ ...item, parentFolderId: folderId, selectedIDs: ids }}
			style={{ display: 'block' }}
			onDragStart={(e): void => dragCheck(e, item.id)}
			data-testid="MailItemContainer"
		>
			<DraggableItem
				item={item}
				folderId={folderId}
				isMessageView={isMessageView}
				dragCheck={dragCheck}
				selectedIds={ids}
			>
				<Container mainAlignment="flex-start" data-testid={`MessageListItem-${item.id}`}>
					<ListItemActionWrapper
						item={item}
						onClick={_onClick}
						onDoubleClick={_onDoubleClick}
						current={active}
					>
						<div style={{ alignSelf: 'center' }} data-testid={`AvatarContainer`}>
							<ItemAvatar
								item={item}
								selected={selected}
								selecting={selecting}
								toggle={toggle}
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
									item={item}
									textValues={textReadValues}
									isFromSearch={item.isFromSearch}
								/>
								<Row>
									{item.isFromSearch && item.parent === FOLDERS.TRASH && (
										<Padding left="small">
											<Icon data-testid="deleted-in-search-icon" icon="Trash2Outline" />
										</Padding>
									)}
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
									{messageFolder && messageFolder.id !== folderId && !item.isFromSearch && (
										<Padding left="small">
											<Badge
												data-testid="FolderBadge"
												value={messageFolder.name}
												type={textReadValues.badge}
											/>
										</Padding>
									)}
								</Row>
							</Container>
						</Row>
					</ListItemActionWrapper>
				</Container>
			</DraggableItem>
		</Drag>
	) : (
		<div style={{ height: '4rem' }} />
	);
};
