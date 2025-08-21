/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import { hasModalOverlay, isInputContext } from './utils';
import { MAILS_ROUTE } from 'constants/index';
import { useConvMoveToTrashFn } from 'hooks/actions/use-conv-move-to-trash';
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

const MODIFIER_KEYS: string[] = ['m', '.', 'n'];

type UseKeyboardShortcutsForConvProps = {
	conversationIds: Array<string>;
	folderId: string;
};

export const useKeyboardShortcutsForConv = ({
	conversationIds,
	folderId
}: UseKeyboardShortcutsForConvProps): ((event: KeyboardEvent) => void) => {
	const keySequence = useRef<string>('');
	const navigate = useNavigate();

	// store the conversation IDs and folder ID in refs to avoid unnecessary re-renders
	const conversationIdsRef = useRef(conversationIds);
	const folderIdRef = useRef(folderId);

	useEffect(() => {
		conversationIdsRef.current = conversationIds;
		folderIdRef.current = folderId;
	}, [conversationIds, folderId]);

	const closePreviewPanel = useCallback(
		() => navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true }),
		[folderId, navigate]
	);
	const markAsSpam = useConvSetSpamFn({
		ids: conversationIdsRef.current,
		folderId: folderIdRef.current,
		shouldReplaceHistory: true
	});

	const markAsNotSpam = useConvSetNotSpamFn({
		ids: conversationIdsRef.current,
		folderId: folderIdRef.current,
		shouldReplaceHistory: true
	});

	const moveToTrash = useConvMoveToTrashFn({
		ids: conversationIdsRef.current,
		folderId: folderIdRef.current
	});

	const setAsRead = useConvSetReadFn({
		ids: conversationIdsRef.current,
		folderId: folderIdRef.current,
		isConversationRead: false
	});

	const setAsUnread = useConvSetUnreadFn({
		ids: conversationIdsRef.current,
		folderId: folderIdRef.current,
		isConversationRead: false
	});

	const flag = useConvSetFlagFn(conversationIdsRef.current, false);
	const unflag = useConvSetUnflagFn(conversationIdsRef.current, true);

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
