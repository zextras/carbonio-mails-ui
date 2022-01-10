/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	setConversationsSpam,
	moveConversationToTrash,
	setConversationsFlag,
	setConversationsRead
} from '../ui-actions/conversation-actions';

type handleKeyboardShortcutsProps = {
	event: any;
	itemId: any;
	folerId: any;
	t: (param: any) => void;
	dispatch: any;
	deselectAll: any;
	createSnackbar: any;
	conversations: Array<any>;
};

const modifierKeysFirstTier = ['v', 'm', '.', 'n'];
const modifierKeysSecondTier: Array<any> = [];

let keySequence = '';

export const handleKeyboardShortcuts = (params: handleKeyboardShortcutsProps): void => {
	const { event, itemId, conversations, t, dispatch, deselectAll, createSnackbar } = params;
	const ctrlModifierIsActive = event.ctrlKey || event.metaKey;
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
					setConversationsRead([itemId], false, t, dispatch).click();
				}
				break;
			case 'z': // Mark read
				if (isGlobalContext) {
					eventActions();
					setConversationsRead([itemId], false, t, dispatch).click();
				}
				break;
			case 'mu': // Mark unread
				if (isGlobalContext) {
					eventActions();
					setConversationsRead([itemId], true, t, dispatch).click();
				}
				break;
			case 'x': // Mark unread
				if (isGlobalContext && itemId) {
					eventActions();
					setConversationsRead([itemId], true, t, dispatch).click();
				}
				break;
			case 'mf': // Flag/Unflag messages
				if (isGlobalContext && itemId) {
					eventActions();
					setConversationsFlag([itemId], conversationFlag, t, dispatch).click();
				}
				break;
			case 'ms': // Report (mark as) spam
				if (isGlobalContext && itemId) {
					eventActions();
					setConversationsSpam([itemId], false, t, dispatch, createSnackbar, deselectAll).click();
				}
				break;
			case '.t': // Move to Trash
				if (isGlobalContext && itemId) {
					eventActions();
					moveConversationToTrash([itemId], t, dispatch, createSnackbar, deselectAll).click();
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
				null;
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
			null;
	}
};
