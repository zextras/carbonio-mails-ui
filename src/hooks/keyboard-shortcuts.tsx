/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { noop } from 'lodash';

import { AppDispatch } from '../store/redux';
import {
	setConversationsFlag,
	setConversationsRead,
	useSetConversationAsSpam,
	useDeleteConversationPermanently,
	useMoveConversationToFolder,
	useMoveConversationToTrash
} from '../ui-actions/conversation-actions';
import {
	useDeleteMessagePermanently,
	useMoveMessageToFolder,
	useMoveMsgToTrash
} from '../ui-actions/message-actions';

import { isConversation, isSingleMessageConversation } from '../helpers/messages';

type HandleKeyboardShortcutsProps = {
	event: any;
	itemId: string;
	folderId: string;
	dispatch: AppDispatch;
	deselectAll: () => void;
	conversations: Array<any>;
};

const modifierKeysFirstTier = ['v', 'm', '.', 'n'];
const modifierKeysSecondTier: Array<any> = [];
const modifierKeysThirdTier = ['Delete','ShiftDelete'];

let keySequence = '';
export const handleKeyboardShortcuts = (params: HandleKeyboardShortcutsProps): void => {
	const { event, itemId, conversations, dispatch, deselectAll, folderId } = params;
	const conversationFlag = conversations.filter((conversation) => conversation.id === itemId)?.[0]
		?.flagged;

	const eventActions = (): void => {
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	const isGlobalContext =
		event?.target?.isContentEditable === false &&
		event?.target?.nodeName !== 'INPUT' &&
		event.target.nodeName !== 'TEXTAREA';

	const callKeyboardShortcutAction = (): void => {
		const findMsg = conversations.find(item => item.id === itemId);
		let isSingleMessage, isFullConv = false;
		if (typeof findMsg !== 'undefined') {  
			isSingleMessage = isSingleMessageConversation(findMsg);
			isFullConv = isConversation(findMsg);
		}
		if (!isGlobalContext ){
			keySequence = '';
			return;
		}
		switch (keySequence) {
			case 'mr': // Mark read
				if (isGlobalContext && (isFullConv || isSingleMessage)) {
					eventActions();
					setConversationsRead({
						ids: [itemId],
						value: false,
						dispatch,
						deselectAll: noop,
						shouldReplaceHistory: false,
						folderId
					}).onClick(event);
				}
				break;
			case 'z': // Mark read
				if (isGlobalContext && (isFullConv || isSingleMessage)) {
					eventActions();
					setConversationsRead({
						ids: [itemId],
						value: false,
						dispatch,
						deselectAll: noop,
						shouldReplaceHistory: false,
						folderId
					}).onClick(event);
				}
				break;
			case 'mu': // Mark unread
				if (isGlobalContext && (isFullConv || isSingleMessage)) {
					eventActions();
					setConversationsRead({
						ids: [itemId],
						value: true,
						dispatch,
						deselectAll: noop,
						shouldReplaceHistory: false,
						folderId
					}).onClick(event);
				}
				break;
			case 'x': // Mark unread
				if (isGlobalContext && itemId && (isFullConv || isSingleMessage)) {
					eventActions();
					setConversationsRead({
						ids: [itemId],
						value: true,
						dispatch,
						deselectAll: noop,
						shouldReplaceHistory: false,
						folderId
					}).onClick(event);
				}
				break;
			case 'mf': // Flag/Unflag messages
				if (isGlobalContext && itemId && (isFullConv || isSingleMessage)) {
					eventActions();
					setConversationsFlag({ ids: [itemId], value: conversationFlag, dispatch }).onClick(event);
				}
				break;
			case 'ms': // Report (mark as) spam
				if (isGlobalContext && itemId && (isFullConv || isSingleMessage)) {
					eventActions();
					const setConversationAsSpam = useSetConversationAsSpam();
					setConversationAsSpam({
						ids: [itemId],
						value: false,
						dispatch,
						deselectAll
					}).onClick(event);
				}
				break;
			case '.t': // Move to Trash
				if (isGlobalContext && itemId) {
					eventActions();
					const moveConversationToTrash = useMoveConversationToTrash();
					moveConversationToTrash({
						ids: [itemId],
						dispatch,
						deselectAll,
						folderId
					}).onClick(event);
				}
				break;
			case '.i': // Move to Inbox
				if (isGlobalContext) {
					eventActions();
				}
				break;
			case 'r': // Reply
				if (isGlobalContext) {
					eventActions();
				}
				break;
			case 'a': // Reply all
				if (isGlobalContext) {
					eventActions();
				}
				break;
			case 'f': // Forward message
				if (isGlobalContext) {
					eventActions();
				}
				break;
			case 'nf': // New folder
				if (isGlobalContext) {
					eventActions();
				}
				break;
			case 'mm': // Move Message
				if (isGlobalContext && (isFullConv || isSingleMessage)) {
					eventActions();
					const moveConversationToFolder = useMoveConversationToFolder();
					const moveMessageToFolder = useMoveMessageToFolder();
					isFullConv
					? moveConversationToFolder({
							ids: [itemId],
							dispatch,
							deselectAll,
							folderId,
							isRestore: false
					}).onClick(event)
					: moveMessageToFolder({
							id: [itemId],
							folderId,
							dispatch,
							isRestore: false,
							deselectAll
					}).onClick(event);
				}
				break;
			case 'Delete': //Delete
				if (isGlobalContext && (isFullConv || isSingleMessage)) {
					eventActions();
					const moveConversationToTrash = useMoveConversationToTrash();
					const moveMsgToTrash = useMoveMsgToTrash();
					isFullConv
					? moveConversationToTrash({ ids: [itemId], 
						dispatch, 
						folderId, 
						deselectAll }).onClick(event)
					: moveMsgToTrash({ ids: [itemId], 
						dispatch, 
						deselectAll }).onClick(event);
				}
				break;
			case 'ShiftDelete': //DeletePermantely
				if (isGlobalContext && (isFullConv || isSingleMessage)) {
					eventActions();
					const deleteConversationPermanently = useDeleteConversationPermanently();
					const deleteMessagePermanently = useDeleteMessagePermanently();
					isFullConv
					? deleteConversationPermanently({ ids: [itemId], 
						deselectAll }).onClick(event)
					: deleteMessagePermanently({ ids: [itemId], 
						dispatch,
						deselectAll }).onClick(event);
				}
				break;
			default:
		}
		keySequence = '';
	};

	
	keySequence = keySequence.concat(event.key);
	const timer = setTimeout(callKeyboardShortcutAction, 1000);

	switch (keySequence.length) {
		case 1:
			if (modifierKeysFirstTier.indexOf(event.key) === -1) {
				clearTimeout(timer);
				callKeyboardShortcutAction();
			}
			break;
		case 2:
			if (modifierKeysSecondTier.indexOf(event.key) === -1) {
				clearTimeout(timer);
				callKeyboardShortcutAction();
			}
			break;
		default:
			if (modifierKeysThirdTier.indexOf(event.key) !== -1 && keySequence.length > 2 ) {
				clearTimeout(timer);
				callKeyboardShortcutAction();
			}
			break;
	}
};
