/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import { useMsgMoveToTrashFn } from './actions/use-msg-move-to-trash';
import { useMsgSetFlagFn } from './actions/use-msg-set-flag';
import { useMsgSetNotSpamFn } from './actions/use-msg-set-not-spam';
import { useMsgSetReadFn } from './actions/use-msg-set-read';
import { useMsgSetSpamFn } from './actions/use-msg-set-spam';
import { useMsgSetUnflagFn } from './actions/use-msg-set-unflag';
import { useMsgSetUnreadFn } from './actions/use-msg-set-unread';
import { useInSearchModule } from '../ui-actions/utils';
import { MAILS_ROUTE, SEARCH_ROUTE } from 'constants/index';

const MSG_KEYBOARD_SHORTCUTS = {
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

type UseKeyboardShortcutsForMsgProps = {
	messageIds: Array<string>;
	folderId: string;
};

export const useKeyboardShortcutsForMsg = ({
	messageIds,
	folderId
}: UseKeyboardShortcutsForMsgProps): ((event: KeyboardEvent) => void) => {
	const isSearchContext = useInSearchModule();
	const keySequence = useRef<string>('');
	const navigate = useNavigate();

	const closePreviewPanel = useCallback(
		() =>
			isSearchContext
				? navigate(`/${SEARCH_ROUTE}`, { replace: true })
				: navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true }),
		[folderId, isSearchContext, navigate]
	);
	const markAsSpam = useMsgSetSpamFn({
		ids: messageIds,
		folderId,
		shouldReplaceHistory: true
	});

	const markAsNotSpam = useMsgSetNotSpamFn({
		ids: messageIds,
		folderId,
		shouldReplaceHistory: true
	});

	const moveToTrash = useMsgMoveToTrashFn({
		ids: messageIds,
		messageFolderId: folderId
	});

	const setAsRead = useMsgSetReadFn({
		ids: messageIds,
		folderId,
		isMessageRead: false
	});

	const setAsUnread = useMsgSetUnreadFn({
		ids: messageIds,
		folderId,
		isMessageRead: true
	});

	const flag = useMsgSetFlagFn(messageIds, false);
	const unflag = useMsgSetUnflagFn(messageIds, true);

	const callKeyboardShortcutAction = useCallback(
		(eventActions: () => void): void => {
			switch (true) {
				case MSG_KEYBOARD_SHORTCUTS.MARK_READ.includes(keySequence.current):
					eventActions();
					setAsRead.canExecute() && setAsRead.execute();
					break;
				case MSG_KEYBOARD_SHORTCUTS.MARK_UNREAD.includes(keySequence.current):
					eventActions();
					setAsUnread.canExecute() && setAsUnread.execute();
					break;
				case MSG_KEYBOARD_SHORTCUTS.FLAG_TOGGLE.includes(keySequence.current):
					eventActions();
					flag.canExecute() && flag.execute();
					unflag.canExecute() && unflag.execute();
					break;
				case MSG_KEYBOARD_SHORTCUTS.SPAM_TOGGLE.includes(keySequence.current):
					eventActions();
					markAsSpam.canExecute() && markAsSpam.execute();
					markAsNotSpam.canExecute() && markAsNotSpam.execute();
					break;
				case MSG_KEYBOARD_SHORTCUTS.MOVE_TO_TRASH.includes(keySequence.current):
					eventActions();
					moveToTrash.canExecute() && moveToTrash.execute();
					break;
				case MSG_KEYBOARD_SHORTCUTS.CLOSE_PRVIEW_PANEL.includes(keySequence.current):
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

			keySequence.current = keySequence.current.concat(event.key);

			/**
			 * Sets a timeout to trigger the keyboard shortcut action after 1 second.
			 * If the pressed key is not a modifier key, cancels the timeout and triggers the action immediately.
			 * This ensures modifier keys are handled with a delay, while other keys respond instantly.
			 */
			const timer = setTimeout(callKeyboardShortcutAction, 1000);
			if (MODIFIER_KEYS.indexOf(event.key) === -1) {
				clearTimeout(timer);
				callKeyboardShortcutAction(eventActions);
			}
		},
		[callKeyboardShortcutAction]
	);
};
