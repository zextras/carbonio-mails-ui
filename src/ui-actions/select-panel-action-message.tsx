/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo } from 'react';
import { Container, Dropdown, IconButton } from '@zextras/carbonio-design-system';
import { FOLDERS, useTags } from '@zextras/carbonio-shell-ui';
import { map, every, filter, some } from 'lodash';

import { useDispatch } from 'react-redux';

import {
	setMsgRead,
	setMsgFlag,
	moveMsgToTrash,
	moveMessageToFolder,
	deleteMessagePermanently
} from './message-actions';
import { applyMultiTag } from './tag-actions';
import { MailMessage } from '../types';

type SelectMessagesPanelActionsPropType = {
	messages: MailMessage[];
	folderId: string;
	selectedIds: Array<string>;
	deselectAll: () => void;
};
const SelectMessagesPanelActions: FC<SelectMessagesPanelActionsPropType> = ({
	messages,
	folderId,
	selectedIds,
	deselectAll
}) => {
	const dispatch = useDispatch();
	const ids = useMemo(() => Object.keys(selectedIds ?? []), [selectedIds]);
	const selectedConversation = filter(messages, (convo) => ids.indexOf(convo.id) !== -1);
	const tags = useTags();

	const showAddFlag = useMemo(() => {
		const selectMessages = filter(messages, (convo) => ids.indexOf(convo.id) !== -1);
		return every(selectMessages, ['flagged', true]);
	}, [messages, ids]);

	const showReadConvo = useMemo(() => {
		const selectMessages = filter(messages, (convo) => ids.indexOf(convo.id) !== -1);
		return some(selectMessages, ['read', true]);
	}, [messages, ids]);

	const showUnreadConvo = useMemo(() => {
		const selectMessages = filter(messages, (convo) => ids.indexOf(convo.id) !== -1);
		return some(selectMessages, ['read', false]);
	}, [messages, ids]);

	const primaryActions = useMemo(() => {
		switch (folderId) {
			case FOLDERS.SPAM:
			case FOLDERS.INBOX:
				return [
					showReadConvo && setMsgRead({ ids, value: true, dispatch, folderId, deselectAll }),
					showUnreadConvo && setMsgRead({ ids, value: false, dispatch, folderId, deselectAll }),
					moveMsgToTrash({
						ids,
						dispatch,
						deselectAll,
						folderId
					})

					// archiveMsg
					// editTagsMsg
				];
			case FOLDERS.SENT:
				return [
					moveMsgToTrash({ ids, dispatch, deselectAll, folderId })
					// archiveMsg
					// editTagsMsg
				];

			case FOLDERS.DRAFTS:
				return [
					moveMsgToTrash({ ids, dispatch, deselectAll, folderId })
					// archiveMsg
					// editTagsMsg
				];

			case FOLDERS.TRASH:
				return [
					deleteMessagePermanently({ ids, dispatch, deselectAll })

					// archiveMsg
					// editTagsMsg
				];

			default:
				return [
					moveMsgToTrash({ ids, dispatch, deselectAll, folderId })
					// archiveMsg
					// editTagsMsg
				];
		}
	}, [folderId, showReadConvo, ids, dispatch, deselectAll, showUnreadConvo]);

	const secondaryActions = useMemo(() => {
		switch (folderId) {
			case FOLDERS.SENT:
			case FOLDERS.SPAM:
			case FOLDERS.INBOX:
				return [
					showReadConvo && setMsgRead({ ids, value: true, dispatch, folderId, deselectAll }),
					showUnreadConvo && setMsgRead({ ids, value: false, dispatch, folderId, deselectAll }),
					setMsgFlag({ ids, value: showAddFlag, dispatch }),
					moveMessageToFolder({
						id: ids,
						dispatch,
						isRestore: false,
						deselectAll
					}),
					applyMultiTag({
						ids,
						tags,
						conversations: selectedConversation,
						folderId,
						deselectAll,
						isMessage: true
					})
					// move
					// markSpam
					// reply
					// replyAll
					// forward
					// redirect
					// editAsNew
					// print
					// createFilter
					// createAppointment
					// openInSeperateWindow
					// archiveConversation
					// editTagsConversation
				];
			case FOLDERS.TRASH:
				return [
					// setConversationsRead(selectedIDs, conversation.read, t, dispatch),
					// setConversationsFlag(selectedIDs, allRead, t, dispatch),
					setMsgFlag({ ids, value: showAddFlag, dispatch }),
					deleteMessagePermanently({ ids, dispatch, deselectAll }),
					moveMessageToFolder({
						id: ids,
						dispatch,
						isRestore: true,
						deselectAll
					})
				];
			case FOLDERS.DRAFTS:
			default:
				return [
					setMsgFlag({ ids, value: showAddFlag, dispatch }),
					moveMessageToFolder({
						id: ids,
						dispatch,
						isRestore: false,
						deselectAll
					})
					// move
					// archiveConversation
					// editTagsConversation
					// print
					// send
				];
		}
	}, [
		folderId,
		showReadConvo,
		ids,
		dispatch,
		deselectAll,
		showUnreadConvo,
		showAddFlag,
		tags,
		selectedConversation
	]);
	return (
		<Container
			background="gray5"
			height={49}
			orientation="horizontal"
			padding={{ all: 'extrasmall' }}
		>
			<Container background="gray5" orientation="horizontal" mainAlignment="flex-start">
				<IconButton
					icon="ArrowBack"
					color="primary"
					size="large"
					onClick={deselectAll}
					data-testid="action-button-deselect-all"
				/>
				{/* Uncomment this line to show the `Select all` Button */}
				{/* <Button type='ghost' label='Select all' color='primary' /> */}
			</Container>
			<Container background="gray5" orientation="horizontal" mainAlignment="flex-end">
				{map(
					filter(primaryActions),
					(action: { label: string; icon: string; click?: () => void }) => (
						<IconButton
							data-testid={`primary-action-button-${action.label}`}
							icon={action.icon}
							color="primary"
							onClick={(ev): void => {
								if (ev) ev.preventDefault();
								action.click && action.click();
							}}
							size="medium"
						/>
					)
				)}
			</Container>

			<Dropdown
				placement="right-end"
				data-testid="secondary-actions-dropdown"
				items={map(
					filter(secondaryActions),
					(action: {
						label: string;
						icon: string;
						click?: () => void;
						customComponent?: ReactElement;
						items?: Array<any>;
					}) => ({
						id: action.label,
						icon: action.icon,
						label: action.label,
						click: (ev): void => {
							if (ev) ev.preventDefault();
							action.click && action.click();
						},
						customComponent: action.customComponent,
						items: action.items
					})
				)}
			>
				<IconButton
					size="medium"
					iconColor="primary"
					icon="MoreVertical"
					data-testid="secondary-actions-open-button"
					onClick={(): null => null}
				/>
			</Dropdown>
		</Container>
	);
};
export default SelectMessagesPanelActions;
