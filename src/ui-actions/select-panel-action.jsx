/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useContext, useMemo } from 'react';
import {
	Container,
	Dropdown,
	IconButton,
	SnackbarManagerContext,
	ModalManagerContext
} from '@zextras/carbonio-design-system';
import { map, every, filter, some } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { useUserSettings, useReplaceHistoryCallback, FOLDERS } from '@zextras/zapp-shell';
import {
	moveConversationToTrash,
	setConversationsFlag,
	setConversationsRead,
	moveConversationToFolder,
	deleteConversationPermanently,
	printConversation
} from './conversation-actions';

export default function SelectPanelActions({ conversation, folderId, selectedIds, deselectAll }) {
	const [t] = useTranslation();
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();
	const settings = useUserSettings();
	const timezone = useMemo(
		() => settings?.prefs.zimbraPrefTimeZoneId,
		[settings?.prefs.zimbraPrefTimeZoneId]
	);
	const ids = useMemo(() => Object.keys(selectedIds ?? []), [selectedIds]);
	const createModal = useContext(ModalManagerContext);

	const showAddFlag = useMemo(() => {
		const selectedConversations = filter(conversation, (convo) => ids.indexOf(convo.id) !== -1);
		return every(selectedConversations, ['flagged', true]);
	}, [conversation, ids]);

	const showReadConvo = useMemo(() => {
		const selectedConversations = filter(conversation, (convo) => ids.indexOf(convo.id) !== -1);
		return some(selectedConversations, ['read', true]);
	}, [conversation, ids]);

	const showUnreadConvo = useMemo(() => {
		const selectedConversations = filter(conversation, (convo) => ids.indexOf(convo.id) !== -1);
		return some(selectedConversations, ['read', false]);
	}, [conversation, ids]);
	const replaceHistory = useReplaceHistoryCallback();
	const primaryActions = useMemo(() => {
		switch (folderId) {
			case FOLDERS.SPAM:
			case FOLDERS.INBOX:
				return [
					showReadConvo &&
						setConversationsRead(ids, true, t, dispatch, folderId, null, deselectAll),
					showUnreadConvo &&
						setConversationsRead(ids, false, t, dispatch, folderId, null, deselectAll),
					moveConversationToTrash(
						ids,
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						replaceHistory,
						folderId
					)

					// archiveMsg
					// editTagsMsg
				];
			case FOLDERS.SENT:
				return [
					showReadConvo &&
						setConversationsRead(ids, true, t, dispatch, folderId, null, deselectAll),
					showUnreadConvo &&
						setConversationsRead(ids, false, t, dispatch, folderId, null, deselectAll),
					moveConversationToTrash(
						ids,
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						replaceHistory,
						folderId
					)
					// archiveMsg
					// editTagsMsg
				];

			case FOLDERS.DRAFTS:
				return [
					moveConversationToTrash(
						ids,
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						replaceHistory,
						folderId
					)

					// archiveMsg
					// editTagsMsg
				];

			case FOLDERS.TRASH:
				return [
					deleteConversationPermanently(ids, t, dispatch, createModal, deselectAll)
					// archiveMsg
					// editTagsMsg
				];

			default:
				return [
					moveConversationToTrash(
						ids,
						t,
						dispatch,
						createSnackbar,
						deselectAll,
						replaceHistory,
						folderId
					)
					// archiveMsg
					// editTagsMsg
				];
		}
	}, [
		folderId,
		showReadConvo,
		ids,
		t,
		dispatch,
		deselectAll,
		showUnreadConvo,
		createSnackbar,
		replaceHistory,
		createModal
	]);

	const secondaryActions = useMemo(() => {
		switch (folderId) {
			case FOLDERS.SENT:
			case FOLDERS.SPAM:
			case FOLDERS.INBOX:
				return [
					showReadConvo &&
						setConversationsRead(ids, true, t, dispatch, folderId, null, deselectAll),
					showUnreadConvo &&
						setConversationsRead(ids, false, t, dispatch, folderId, null, deselectAll),
					setConversationsFlag(ids, showAddFlag, t, dispatch),
					moveConversationToFolder(ids, t, dispatch, false, createModal, deselectAll),
					printConversation(ids, t, timezone)
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
					setConversationsFlag(ids, showAddFlag, t, dispatch),
					deleteConversationPermanently(ids, t, dispatch, createModal, deselectAll),
					moveConversationToFolder(ids, t, dispatch, true, createModal, deselectAll)
				];
			case FOLDERS.DRAFTS:
			default:
				return [
					setConversationsFlag(ids, showAddFlag, t, dispatch),
					moveConversationToFolder(ids, t, dispatch, false, createModal, deselectAll)
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
		t,
		dispatch,
		deselectAll,
		showUnreadConvo,
		showAddFlag,
		createModal,
		timezone
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
					size="medium"
					onClick={deselectAll}
					data-testid="action-button-deselect-all"
				/>
				{/* Uncomment this line to show the `Select all` Button */}
				{/* <Button type='ghost' label='Select all' color='primary' /> */}
			</Container>
			<Container background="gray5" orientation="horizontal" mainAlignment="flex-end">
				{map(filter(primaryActions), (action) => (
					<IconButton
						data-testid={`primary-action-button-${action.label}`}
						icon={action.icon}
						color="primary"
						onClick={(ev) => {
							if (ev) ev.preventDefault();
							action.click();
						}}
						size="medium"
					/>
				))}
			</Container>

			<Dropdown
				placement="right-end"
				data-testid="secondary-actions-dropdown"
				items={map(filter(secondaryActions), (action) => ({
					id: action.label,
					icon: action.icon,
					label: action.label,
					click: (ev) => {
						if (ev) ev.preventDefault();
						action.click();
					}
				}))}
			>
				<IconButton
					size="medium"
					iconColor="primary"
					icon="MoreVertical"
					data-testid="secondary-actions-open-button"
				/>
			</Dropdown>
		</Container>
	);
}
