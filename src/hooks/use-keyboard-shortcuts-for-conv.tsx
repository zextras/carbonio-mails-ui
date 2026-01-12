/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useRef } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useInSearchModule } from '../ui-actions/utils';
import { MAILS_ROUTE, SEARCH_ROUTE } from 'constants/index';
import { useConvMoveToTrashFn } from 'hooks/actions/use-conv-move-to-trash';
import { useConvSetFlagFn } from 'hooks/actions/use-conv-set-flag';
import { useConvSetNotSpamFn } from 'hooks/actions/use-conv-set-not-spam';
import { useConvSetReadFn } from 'hooks/actions/use-conv-set-read';
import { useConvSetSpamFn } from 'hooks/actions/use-conv-set-spam';
import { useConvSetUnflagFn } from 'hooks/actions/use-conv-set-unflag';
import { useConvSetUnreadFn } from 'hooks/actions/use-conv-set-unread';

const CONV_KEYBOARD_SHORTCUTS = {
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
	const isSearchContext = useInSearchModule();
	const isConversationMessage = useLocation().pathname.includes('message');
	const keySequence = useRef<string>('');
	const navigate = useNavigate();

	const closePreviewPanel = useCallback(
		() =>
			isSearchContext
				? navigate(`/${SEARCH_ROUTE}`, { replace: true })
				: navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true }),
		[folderId, isSearchContext, navigate]
	);
	const markConvAsSpam = useConvSetSpamFn({
		ids: conversationIds,
		folderId
	});

	const markConvAsNotSpam = useConvSetNotSpamFn({
		ids: conversationIds,
		folderId
	});

	const moveConvToTrash = useConvMoveToTrashFn({
		ids: conversationIds,
		folderId
	});

	const setConvAsRead = useConvSetReadFn({
		ids: conversationIds,
		folderId,
		isConversationRead: false
	});

	const setConvAsUnread = useConvSetUnreadFn({
		ids: conversationIds,
		folderId,
		isConversationRead: true
	});

	const flagConv = useConvSetFlagFn(conversationIds, false);
	const unflagConv = useConvSetUnflagFn(conversationIds, true);

	const callKeyboardShortcutAction = useCallback(
		(defaultEventActions: () => void): void => {
			switch (true) {
				case CONV_KEYBOARD_SHORTCUTS.MARK_READ.includes(keySequence.current):
					defaultEventActions();
					setConvAsRead.canExecute() && setConvAsRead.execute();
					break;
				case CONV_KEYBOARD_SHORTCUTS.MARK_UNREAD.includes(keySequence.current):
					defaultEventActions();
					setConvAsUnread.canExecute() && setConvAsUnread.execute();
					break;
				case CONV_KEYBOARD_SHORTCUTS.FLAG_TOGGLE.includes(keySequence.current):
					defaultEventActions();
					flagConv.canExecute() && flagConv.execute();
					unflagConv.canExecute() && unflagConv.execute();
					break;
				case CONV_KEYBOARD_SHORTCUTS.SPAM_TOGGLE.includes(keySequence.current):
					defaultEventActions();
					markConvAsSpam.canExecute() && markConvAsSpam.execute();
					markConvAsNotSpam.canExecute() && markConvAsNotSpam.execute();
					break;
				case CONV_KEYBOARD_SHORTCUTS.MOVE_TO_TRASH.includes(keySequence.current):
					defaultEventActions();
					moveConvToTrash.canExecute() && moveConvToTrash.execute();
					break;
				case CONV_KEYBOARD_SHORTCUTS.CLOSE_PRVIEW_PANEL.includes(keySequence.current):
					defaultEventActions();
					closePreviewPanel();
					break;
				default:
					break;
			}
			keySequence.current = '';
		},
		[
			closePreviewPanel,
			flagConv,
			markConvAsNotSpam,
			markConvAsSpam,
			moveConvToTrash,
			setConvAsRead,
			setConvAsUnread,
			unflagConv
		]
	);

	return useCallback(
		(event) => {
			const defaultEventActions = (): void => {
				event.preventDefault();
				event.stopImmediatePropagation();
			};

			if (isConversationMessage) {
				return;
			}

			keySequence.current = keySequence.current.concat(event.key);

			/**
			 * Sets a timeout to trigger the keyboard shortcut action after 1 second.
			 * If the pressed key is not a modifier key, cancels the timeout and triggers the action immediately.
			 * This ensures modifier keys are handled with a delay, while other keys respond instantly.
			 */
			const timer = setTimeout(callKeyboardShortcutAction, 1000);
			if (MODIFIER_KEYS.indexOf(event.key) === -1) {
				clearTimeout(timer);
				callKeyboardShortcutAction(defaultEventActions);
			}
		},
		[callKeyboardShortcutAction, isConversationMessage]
	);
};
