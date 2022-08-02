/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useCallback } from 'react';
import { find, isEmpty, reduce, includes } from 'lodash';
import {
	useUserAccounts,
	useAppContext,
	replaceHistory,
	useTags,
	ZIMBRA_STANDARD_COLORS,
	FOLDERS
} from '@zextras/carbonio-shell-ui';
import {
	Badge,
	Container,
	Icon,
	Padding,
	Row,
	Text,
	Drag,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';

import { getTimeLabel, participantToString } from '../../../../commons/utils';
import { selectFolder } from '../../../../store/conversations-slice';
import { ItemAvatar } from './item-avatar';
import { ListItemActionWrapper } from './list-item-actions-wrapper';
import { setMsgRead } from '../../../../ui-actions/message-actions';
import { SenderName } from './sender-name';
import { useTagExist } from '../../../../ui-actions/tag-actions';

function previewFile(file) {
	const preview = document.querySelector('img');
	const reader = new FileReader();

	reader.addEventListener(
		'load',
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
const DraggableItem = ({ item, folderId, children, isMessageView, dragCheck, selectedIds }) =>
	isMessageView ? (
		<Drag
			type="message"
			data={{ ...item, parentFolderId: folderId, selectedIDs: selectedIds }}
			style={{ display: 'block' }}
			onDragStart={(e) => dragCheck(e, item.id)}
		>
			{children}
		</Drag>
	) : (
		<>{children}</>
	);

export default function MessageListItem({
	item,
	folderId,
	active,
	selected,
	selecting,
	toggle = () => null,
	draggedIds,
	setDraggedIds,
	setIsDragging,
	selectedItems,
	dragImageRef,
	visible,
	isConvChildren
}) {
	const [t] = useTranslation();
	const accounts = useUserAccounts();
	const { isMessageView } = useAppContext();
	const messageFolder = useSelector((state) => selectFolder(state, item.parent));
	const ids = useMemo(() => Object.keys(selectedItems ?? []), [selectedItems]);
	const dispatch = useDispatch();
	const tagsFromStore = useTags();

	const tags = useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc, v) => {
					if (includes(item.tags, v.id))
						acc.push({ ...v, color: ZIMBRA_STANDARD_COLORS[v.color ?? '0'].hex });
					return acc;
				},
				[]
			),
		[item.tags, tagsFromStore]
	);

	const [date, participantsString] = useMemo(() => {
		if (item) {
			const sender = find(item.participants, ['type', 'f']);
			return [getTimeLabel(moment(item.date)), participantToString(sender, t, accounts)];
		}
		return ['.', '.', '', ''];
	}, [item, t, accounts]);

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
	}, [item, t]);

	const _onClick = useCallback(
		(e) => {
			if (!e.isDefaultPrevented()) {
				replaceHistory(`/folder/${folderId}/message/${item.id}`);
				if (item.read === false) {
					setMsgRead({ ids: [item.id], value: false, t, dispatch }).click();
				}
			}
		},
		[folderId, item.id, item.read, t, dispatch]
	);
	const _onDoubleClick = useCallback(
		(e) => {
			if (!e.isDefaultPrevented()) {
				const { id, isDraft } = item;
				if (isDraft) replaceHistory(`/folder/${folderId}/edit/${id}?action=editAsDraft`);
			}
		},
		[folderId, item]
	);

	const dragCheck = useCallback(
		(e, id) => {
			setIsDragging(true);
			e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
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
	const textReadValues = useMemo(() => {
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
		[item.subject, t]
	);
	const subFragmentTooltipLabel = useMemo(
		() => (!isEmpty(item.fragment) ? item.fragment : subject),
		[subject, item.fragment]
	);
	return draggedIds?.[item?.id] || visible || isConvChildren ? (
		<Drag
			type="message"
			data={{ ...item, parentFolderId: folderId, selectedIDs: ids }}
			style={{ display: 'block' }}
			onDragStart={(e) => dragCheck(e, item.id)}
		>
			<DraggableItem
				item={item}
				folderId={folderId}
				isMessageView={isMessageView}
				dragCheck={dragCheck}
				selectedIds={ids}
			>
				<Container
					mainAlignment="flex-start"
					data-testid={`SearchMessageListItem-${item.id}`}
					background={item.read ? 'tranparent' : 'gray5'}
				>
					<ListItemActionWrapper item={item} onClick={_onClick} onDoubleClick={_onDoubleClick}>
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
									{item.attachment && (
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
										<Text data-testid="DateLabel" size="extrasmall">
											{date}
										</Text>
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
		<div style={{ height: '64px' }} />
	);
}
