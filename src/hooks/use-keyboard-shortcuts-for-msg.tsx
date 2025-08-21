/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import { useMsgMoveToTrashFn } from './actions/use-msg-move-to-trash';
import { MAILS_ROUTE } from 'constants/index';
import { useConvSetFlagFn } from 'hooks/actions/use-conv-set-flag';
import { useConvSetNotSpamFn } from 'hooks/actions/use-conv-set-not-spam';
import { useConvSetReadFn } from 'hooks/actions/use-conv-set-read';
import { useConvSetSpamFn } from 'hooks/actions/use-conv-set-spam';
import { useConvSetUnflagFn } from 'hooks/actions/use-conv-set-unflag';
import { useConvSetUnreadFn } from 'hooks/actions/use-conv-set-unread';

const KEYBOARD_SHORTCUTS = {
	MARK_READ: ['mr', 'z'],
	MARK_UNREAD: ['mu', 'x'],
	FLAG_TOGGLE: ['mf'],
	SPAM_TOGGLE: ['ms'],
	MOVE_TO_TRASH: ['Delete', 'Backspace', '.t'],
	MOVE_TO_INBOX: ['.i'],
	CLOSE_PRVIEW_PANEL: ['Escape', 'Esc'],
	REPLY: ['r'],
	REPLY_ALL: ['a'],
	FORWARD: ['f'],
	NEW_FOLDER: ['nf']
};

const MODIFIER_KEYS: Array<string> = ['m', '.', 'n'];

const MODAL_SELECTORS = [
	'[data-testid*="modal"]',
	'[data-testid*="Modal"]',
	'[data-testid*="BoardContainerComp"]'
];

type UseKeyboardShortcutsForMsgProps = {
	messageIds: Array<string>;
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

export const useKeyboardShortcutsForMsg = ({
	messageIds,
	folderId
}: UseKeyboardShortcutsForMsgProps): ((event: KeyboardEvent) => void) => {
	const keySequence = useRef<string>('');
	const navigate = useNavigate();

	// store the conversation IDs and folder ID in refs to avoid unnecessary re-renders
	const messageIdsRef = useRef(messageIds);
	const folderIdRef = useRef(folderId);

	useEffect(() => {
		messageIdsRef.current = messageIds;
		folderIdRef.current = folderId;
	}, [messageIds, folderId]);

	const closePreviewPanel = useCallback(
		() => navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true }),
		[folderId, navigate]
	);
	const markAsSpam = useConvSetSpamFn({
		ids: messageIdsRef.current,
		folderId: folderIdRef.current,
		shouldReplaceHistory: true
	});

	const markAsNotSpam = useConvSetNotSpamFn({
		ids: messageIdsRef.current,
		folderId: folderIdRef.current,
		shouldReplaceHistory: true
	});

	const moveToTrash = useMsgMoveToTrashFn({
		ids: messageIdsRef.current,
		folderId: folderIdRef.current
	});

	const setAsRead = useConvSetReadFn({
		ids: messageIdsRef.current,
		folderId: folderIdRef.current,
		isConversationRead: false
	});

	const setAsUnread = useConvSetUnreadFn({
		ids: messageIdsRef.current,
		folderId: folderIdRef.current,
		isConversationRead: false
	});

	const flag = useConvSetFlagFn(messageIdsRef.current, false);
	const unflag = useConvSetUnflagFn(messageIdsRef.current, true);

	const callKeyboardShortcutAction = useCallback(
		(isGlobalContext: boolean, eventActions: () => void): void => {
			if (!isGlobalContext) return;
			switch (true) {
				case KEYBOARD_SHORTCUTS.MARK_READ.includes(keySequence.current):
					eventActions();
					setAsRead.canExecute() && setAsRead.execute();
					break;
				case KEYBOARD_SHORTCUTS.MARK_UNREAD.includes(keySequence.current):
					eventActions();
					setAsUnread.canExecute() && setAsUnread.execute();
					break;
				case KEYBOARD_SHORTCUTS.FLAG_TOGGLE.includes(keySequence.current):
					eventActions();
					flag.canExecute() && flag.execute();
					unflag.canExecute() && unflag.execute();
					break;
				case KEYBOARD_SHORTCUTS.SPAM_TOGGLE.includes(keySequence.current):
					eventActions();
					markAsSpam.canExecute() && markAsSpam.execute();
					markAsNotSpam.canExecute() && markAsNotSpam.execute();
					break;
				case KEYBOARD_SHORTCUTS.MOVE_TO_TRASH.includes(keySequence.current):
					eventActions();
					moveToTrash.canExecute() && moveToTrash.execute();
					break;
				case KEYBOARD_SHORTCUTS.CLOSE_PRVIEW_PANEL.includes(keySequence.current):
					eventActions();
					closePreviewPanel();
					break;
				default:
					break;
			}
			keySequence.current = '';
		},
		[
			closePreviewPanel,
			flag,
			markAsNotSpam,
			markAsSpam,
			moveToTrash,
			setAsRead,
			setAsUnread,
			unflag
		]
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
