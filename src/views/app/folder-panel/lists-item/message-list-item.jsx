/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useCallback, useEffect } from 'react';
import { find, isEmpty } from 'lodash';
import { useUserAccounts, useAppContext, replaceHistory } from '@zextras/carbonio-shell-ui';
import {
	Badge,
	Container,
	Icon,
	Padding,
	Row,
	Text,
	Drag,
	Tooltip,
	Shimmer
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { getTimeLabel, participantToString } from '../../../../commons/utils';
import { selectFolder } from '../../../../store/conversations-slice';
import { ItemAvatar } from './item-avatar';
import ListItemActionWrapper from './list-item-actions-wrapper';
import { setMsgRead } from '../../../../ui-actions/message-actions';
import { searchConv } from '../../../../store/actions';

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
	visible
}) {
	const [t] = useTranslation();
	const accounts = useUserAccounts();
	const { isMessageView } = useAppContext();
	const messageFolder = useSelector((state) => selectFolder(state, item.parent));
	const ids = useMemo(() => Object.keys(selectedItems ?? []), [selectedItems]);
	const dispatch = useDispatch();
	useEffect(() => {
		if (!item.participants) {
			dispatch(searchConv({ folderId, conversationId: item.convId, fetch: '0' }));
		}
	}, [dispatch, folderId, item.convId, item.participants]);
	const [date, participantsString] = useMemo(() => {
		if (item) {
			const sender = find(item.participants, ['type', 'f']);
			return [getTimeLabel(moment(item.date)), participantToString(sender, t, accounts)];
		}
		return ['.', '.', '', ''];
	}, [item, t, accounts]);

	const _onClick = useCallback(
		(e) => {
			if (!e.isDefaultPrevented()) {
				replaceHistory(`/folder/${folderId}/message/${item.id}`);
				setMsgRead([item.id], false, t, dispatch).click();
			}
		},
		[dispatch, folderId, t, item.id]
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
	const fragmentLabel = useMemo(() => item.fragment, [item.fragment]);
	const textReadValues = useMemo(() => {
		if (typeof item.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read' };
		return item.read
			? { color: 'text', weight: 'regular', badge: 'read' }
			: { color: 'primary', weight: 'bold', badge: 'unread' };
	}, [item.read]);

	// eslint-disable-next-line no-nested-ternary
	return !item.participants ? (
		<Shimmer.ListItem type={1} />
	) : draggedIds?.[item?.id] || visible || !isMessageView ? (
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
					data-testid={`ConversationListItem-${item.id}`}
					// eslint-disable-next-line no-nested-ternary
					background={active ? 'highlight' : item.read ? 'gray6' : 'gray5'}
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
								<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start">
									<Text
										data-testid="SenderText"
										color={textReadValues.color}
										size={item.read ? 'small' : 'medium'}
										weight={textReadValues.weight}
									>
										{participantsString}
									</Text>
								</Row>
								<Row>
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
									crossAlignment="baseline"
								>
									{!isEmpty(item.fragment) && (
										<Tooltip label={fragmentLabel} overflow="break-word" maxWidth="60vw">
											<Row takeAvailableSpace mainAlignment="flex-start">
												<Text
													data-testid="Fragment"
													size={item.read ? 'small' : 'medium'}
													weight={textReadValues.weight}
												>
													{fragmentLabel}
												</Text>
											</Row>
										</Tooltip>
									)}
								</Row>
								<Row>
									{item.urgent && (
										<Padding left="extrasmall">
											<Icon data-testid="UrgentIcon" icon="ArrowUpward" color="error" />
										</Padding>
									)}
									{messageFolder && messageFolder.id !== folderId && (
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
