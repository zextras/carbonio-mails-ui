/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { useConvMoveToTrashFn } from 'hooks/actions/use-conv-move-to-trash';
import { useConvSetFlagFn } from 'hooks/actions/use-conv-set-flag';
import { useConvSetNotSpamFn } from 'hooks/actions/use-conv-set-not-spam';
import { useConvSetReadFn } from 'hooks/actions/use-conv-set-read';
import { useConvSetSpamFn } from 'hooks/actions/use-conv-set-spam';
import { useConvSetUnflagFn } from 'hooks/actions/use-conv-set-unflag';
import { useConvSetUnreadFn } from 'hooks/actions/use-conv-set-unread';
import { useConversationById } from 'store/emails/store';
import { NormalizedConversation } from 'types/index.d';

type HandleKeyboardShortcutsArguments = {
	conversationId: NormalizedConversation['id'];
	folderId: string;
};

const modifierKeysFirstTier: string[] = ['v', 'm', '.', 'n'];
const modifierKeysSecondTier: string[] = [];

let keySequence = '';

export const useConversationKeyboardShortcuts = ({
	conversationId,
	folderId
}: HandleKeyboardShortcutsArguments): ((event: KeyboardEvent) => void) => {
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

	return useCallback(
		(event) => {
			const eventActions = (): void => {
				event.preventDefault();
				event.stopImmediatePropagation();
			};

			const isGlobalContext =
				event.target instanceof HTMLElement &&
				!event.target.isContentEditable &&
				event.target.nodeName !== 'INPUT' &&
				event.target.nodeName !== 'TEXTAREA';

			const callKeyboardShortcutAction = (): void => {
				switch (keySequence) {
					case 'mr': // Mark read
					case 'z': // Mark read
						if (isGlobalContext) {
							eventActions();
							setAsRead.canExecute() && setAsRead.execute();
						}
						break;
					case 'mu': // Mark unread
					case 'x': // Mark unread
						if (isGlobalContext) {
							eventActions();
							setAsUnread.canExecute() && setAsUnread.execute();
						}
						break;
					case 'mf': // Flag/Unflag messages
						if (isGlobalContext && conversationId) {
							eventActions();
							flag.canExecute() && flag.execute();
							unflag.canExecute() && unflag.execute();
						}
						break;
					case 'ms': // Report (mark as) spam
						if (isGlobalContext && conversationId) {
							eventActions();
							markAsSpam.canExecute() && markAsSpam.execute();
							markAsNotSpam.canExecute() && markAsNotSpam.execute();
						}
						break;
					case '.t': // Move to Trash
						if (isGlobalContext && conversationId) {
							eventActions();
							moveToTrash.canExecute() && moveToTrash.execute();
						}
						break;
					case '.i': // Move to Inbox
					case 'r': // Reply
					case 'a': // Reply all
					case 'f': // Forward message
					case 'nf': // New folder
						if (isGlobalContext) {
							eventActions();
						}
						break;
					default:
						break;
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
					// FIXME: modifierKeysSecondTier can only be empty here, so the if condition is always true
					if (modifierKeysSecondTier.indexOf(event.key) === -1) {
						clearTimeout(timer);
						callKeyboardShortcutAction();
					}
					break;

				default:
			}
		},
		[flag, conversationId, markAsNotSpam, markAsSpam, moveToTrash, setAsRead, setAsUnread, unflag]
	);
};
