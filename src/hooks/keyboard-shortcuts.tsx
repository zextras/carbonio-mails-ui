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
	setConversationsSpam
} from '../ui-actions/conversation-actions';

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
		switch (keySequence) {
			case 'mr': // Mark read
				if (isGlobalContext) {
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
				if (isGlobalContext) {
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
				if (isGlobalContext) {
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
				if (isGlobalContext && itemId) {
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
				if (isGlobalContext && itemId) {
					eventActions();
					setConversationsFlag({ ids: [itemId], value: conversationFlag, dispatch }).onClick(event);
				}
				break;
			case 'ms': // Report (mark as) spam
				if (isGlobalContext && itemId) {
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
	}
};
