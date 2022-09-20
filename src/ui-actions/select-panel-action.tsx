/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Container,
	Dropdown,
	IconButton,
	ModalManagerContext,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { FOLDERS, useTags, useUserAccount } from '@zextras/carbonio-shell-ui';
import { every, filter, map, some } from 'lodash';
import React, { FC, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Conversation } from '../types';

import {
	deleteConversationPermanently,
	moveConversationToFolder,
	moveConversationToTrash,
	printConversation,
	setConversationsFlag,
	setConversationsRead
} from './conversation-actions';
import { applyMultiTag } from './tag-actions';

type SelectPanelActionsPropType = {
	conversation: Array<Conversation>;
	folderId: string;
	selectedIds: Array<string>;
	deselectAll: () => void;
};
const SelectPanelActions: FC<SelectPanelActionsPropType> = ({
	conversation,
	folderId,
	selectedIds,
	deselectAll
}) => {
	const dispatch = useDispatch();
	const account = useUserAccount();
	const ids = useMemo(() => Object.keys(selectedIds ?? []), [selectedIds]);
	const selectedConversation = filter(conversation, (convo) => ids.indexOf(convo.id) !== -1);
	const tags = useTags();

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
	const primaryActions = useMemo(() => {
		switch (folderId) {
			case FOLDERS.SPAM:
			case FOLDERS.INBOX:
				return [
					showReadConvo &&
						//	setConversationsRead(ids, true, t, dispatch, folderId, null, deselectAll),
						setConversationsRead({
							ids,
							value: true,
							dispatch,
							folderId,
							deselectAll,
							shouldReplaceHistory: false
						}),

					showUnreadConvo &&
						setConversationsRead({
							ids,
							value: false,
							dispatch,
							folderId,
							deselectAll,
							shouldReplaceHistory: false
						}),
					moveConversationToTrash({ ids, dispatch, deselectAll, folderId })

					// archiveMsg
					// editTagsMsg
				];
			case FOLDERS.SENT:
				return [
					showReadConvo &&
						setConversationsRead({
							ids,
							value: true,
							dispatch,
							folderId,
							deselectAll,
							shouldReplaceHistory: false
						}),
					showUnreadConvo &&
						setConversationsRead({
							ids,
							value: false,
							dispatch,
							folderId,
							deselectAll,
							shouldReplaceHistory: false
						}),
					moveConversationToTrash({ ids, dispatch, deselectAll, folderId })
					// archiveMsg
					// editTagsMsg
				];

			case FOLDERS.DRAFTS:
				return [
					moveConversationToTrash({ ids, dispatch, deselectAll, folderId })

					// archiveMsg
					// editTagsMsg
				];

			case FOLDERS.TRASH:
				return [
					deleteConversationPermanently({ ids, deselectAll })
					// archiveMsg
					// editTagsMsg
				];

			default:
				return [
					moveConversationToTrash({ ids, dispatch, deselectAll, folderId })
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
					showReadConvo &&
						setConversationsRead({
							ids,
							value: true,
							dispatch,
							folderId,
							deselectAll,
							shouldReplaceHistory: false
						}),
					showUnreadConvo &&
						setConversationsRead({
							ids,
							value: false,
							dispatch,
							folderId,
							deselectAll,
							shouldReplaceHistory: false
						}),
					setConversationsFlag({ ids, value: showAddFlag, dispatch }),
					moveConversationToFolder({
						ids,
						dispatch,
						isRestore: false,
						deselectAll
					}),
					printConversation({ conversation: selectedConversation, account }),
					applyMultiTag({
						ids,
						tags,
						conversations: selectedConversation,
						folderId,
						deselectAll
					})
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
					setConversationsFlag({ ids, value: showAddFlag, dispatch }),
					deleteConversationPermanently({ ids, deselectAll }),
					moveConversationToFolder({
						ids,
						dispatch,
						isRestore: true,
						deselectAll
					}),
					applyMultiTag({
						ids,
						tags,
						conversations: selectedConversation,
						folderId,
						deselectAll
					})
				];
			case FOLDERS.DRAFTS:
			default:
				return [
					setConversationsFlag({ ids, value: showAddFlag, dispatch }),
					moveConversationToFolder({
						ids,
						dispatch,
						isRestore: false,
						deselectAll
					}),
					applyMultiTag({
						ids,
						tags,
						conversations: selectedConversation,
						folderId,
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
		selectedConversation,
		account,
		tags
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
				{map(filter(primaryActions), (action) => {
					if (typeof action === 'boolean') {
						return <></>;
					}

					return (
						<IconButton
							data-testid={`primary-action-button-${action.label}`}
							icon={action.icon}
							color="primary"
							onClick={(ev): void => {
								if (ev) ev.preventDefault();
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								action.click(ev);
							}}
							size="medium"
						/>
					);
				})}
			</Container>

			<Dropdown
				placement="right-end"
				data-testid="secondary-actions-dropdown"
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				items={map(filter(secondaryActions), (action) => {
					if (typeof action === 'boolean') {
						return { id: ';' };
					}

					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					return {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						id: action.label,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						icon: action.icon,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						label: action.label,
						click: (ev): void => {
							if (ev) ev.preventDefault();
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							action.click();
						},
						customComponent: action.customComponent,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						items: action.items
					};
				})}
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
export default SelectPanelActions;
