/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useRef } from 'react';

import { useConvMoveToTrashFn } from 'hooks/actions/use-conv-move-to-trash';
import { useConvSetFlagFn } from 'hooks/actions/use-conv-set-flag';
import { useConvSetNotSpamFn } from 'hooks/actions/use-conv-set-not-spam';
import { useConvSetReadFn } from 'hooks/actions/use-conv-set-read';
import { useConvSetSpamFn } from 'hooks/actions/use-conv-set-spam';
import { useConvSetUnflagFn } from 'hooks/actions/use-conv-set-unflag';
import { useConvSetUnreadFn } from 'hooks/actions/use-conv-set-unread';
import { useConversationById } from 'store/emails/store';
import { NormalizedConversation } from 'types/index.d';

const KEYBOARD_SHORTCUTS = {
	MARK_READ: ['mr', 'z'],
	MARK_UNREAD: ['mu', 'x'],
	FLAG_TOGGLE: ['mf'],
	SPAM_TOGGLE: ['ms'],
	MOVE_TO_TRASH: ['Delete', 'Backspace', '.t'],
	MOVE_TO_INBOX: ['.i'],
	REPLY: ['r'],
	REPLY_ALL: ['a'],
	FORWARD: ['f'],
	NEW_FOLDER: ['nf']
};

const MODIFIER_KEYS: string[] = ['v', 'm', '.', 'n'];

const MODAL_SELECTORS = [
	'[data-testid*="modal"]',
	'[data-testid*="Modal"]',
	'[data-testid*="BoardContainerComp"]'
];

type UseKeyboardShortcutsForConvProps = {
	conversationId: NormalizedConversation['id'];
	folderId: string;
};

function isInputContext(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return true;

	const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
	return (
		target.isContentEditable ||
		inputTags.includes(target.nodeName) ||
		target.closest('[contenteditable="true"]') !== null
	);
}

function hasModalOverlay(): boolean {
	return MODAL_SELECTORS.some((selector) => document.querySelector(selector) !== null);
}

export const useKeyboardShortcutsForConv = ({
	conversationId,
	folderId
}: UseKeyboardShortcutsForConvProps): ((event: KeyboardEvent) => void) => {
	const keySequence = useRef<string>('');
	const conversation = useConversationById(conversationId);

	const markAsSpam = useConvSetSpamFn({
		ids: [conversationId],
		folderId,
		shouldReplaceHistory: true
	});

	const markAsNotSpam = useConvSetNotSpamFn({
		ids: [conversationId],
		folderId,
		shouldReplaceHistory: true
	});

	const moveToTrash = useConvMoveToTrashFn({
		ids: [conversationId],
		folderId
	});

	const setAsRead = useConvSetReadFn({
		ids: [conversationId],
		folderId,
		isConversationRead: conversation?.read
	});
	const setAsUnread = useConvSetUnreadFn({
		ids: [conversationId],
		folderId,
		isConversationRead: conversation?.read
	});

	const flag = useConvSetFlagFn([conversationId], conversation?.flagged);
	const unflag = useConvSetUnflagFn([conversationId], conversation?.flagged);

	const callKeyboardShortcutAction = useCallback(
		(isGlobalContext: boolean, eventActions: () => void): void => {
			switch (true) {
				case KEYBOARD_SHORTCUTS.MARK_READ.includes(keySequence.current):
					if (isGlobalContext) {
						eventActions();
						setAsRead.canExecute() && setAsRead.execute();
					}
					break;
				case KEYBOARD_SHORTCUTS.MARK_UNREAD.includes(keySequence.current):
					if (isGlobalContext) {
						eventActions();
						setAsUnread.canExecute() && setAsUnread.execute();
					}
					break;
				case KEYBOARD_SHORTCUTS.FLAG_TOGGLE.includes(keySequence.current):
					if (isGlobalContext && conversationId) {
						eventActions();
						flag.canExecute() && flag.execute();
						unflag.canExecute() && unflag.execute();
					}
					break;
				case KEYBOARD_SHORTCUTS.SPAM_TOGGLE.includes(keySequence.current):
					if (isGlobalContext && conversationId) {
						eventActions();
						markAsSpam.canExecute() && markAsSpam.execute();
						markAsNotSpam.canExecute() && markAsNotSpam.execute();
					}
					break;
				case KEYBOARD_SHORTCUTS.MOVE_TO_TRASH.includes(keySequence.current):
					if (isGlobalContext && conversationId) {
						eventActions();
						moveToTrash.canExecute() && moveToTrash.execute();
					}
					break;
				default:
					break;
			}
			keySequence.current = '';
		},
		[conversationId, flag, markAsNotSpam, markAsSpam, moveToTrash, setAsRead, setAsUnread, unflag]
	);

	return useCallback(
		(event) => {
			const eventActions = (): void => {
				event.preventDefault();
				event.stopImmediatePropagation();
			};

			if (hasModalOverlay()) {
				return;
			}

			const isGlobalContext = !isInputContext(event.target);
			keySequence.current = keySequence.current.concat(event.key);

			/**
			 * Sets a timeout to trigger the keyboard shortcut action after 1 second.
			 * If the pressed key is not a modifier key, cancels the timeout and triggers the action immediately.
			 * This ensures modifier keys are handled with a delay, while other keys respond instantly.
			 */
			const timer = setTimeout(callKeyboardShortcutAction, 1000);
			if (MODIFIER_KEYS.indexOf(event.key) === -1) {
				clearTimeout(timer);
				callKeyboardShortcutAction(isGlobalContext, eventActions);
			}
		},
		[callKeyboardShortcutAction]
	);
};
