/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { noop } from 'lodash';
import {
	moveConversationToTrash,
	setConversationsFlag,
	setConversationsRead,
	setConversationsSpam,
	deleteConversationPermanently,
	moveConversationToFolder
} from '../ui-actions/conversation-actions';
import {
	deleteMessagePermanently,
	moveMessageToFolder,
	moveMsgToTrash
} from '../ui-actions/message-actions';
import { isConversation, isSingleMessageConversation } from '../helpers/messages';

type handleKeyboardShortcutsProps = {
	event: any;
	itemId: any;
	folderId: any;
	dispatch: any;
	deselectAll: any;
	conversations: Array<any>;
};

const modifierKeysFirstTier = ['v', 'm', '.', 'n'];
const modifierKeysSecondTier: Array<any> = [];
const modifierKeysThirdTier = ['Delete','ShiftDelete'];

let keySequence = '';

export const handleKeyboardShortcuts = (params: handleKeyboardShortcutsProps): void => {
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
					setConversationsSpam({
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
					isFullConv
					? moveConversationToFolder({
							ids: [itemId],
							dispatch,
							folderId,
							isRestore: false,
							deselectAll
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
