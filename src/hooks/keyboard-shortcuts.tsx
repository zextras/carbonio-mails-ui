/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { noop } from 'lodash';

import {
	ConvActionPropType,
	setConversationsFlag,
	setConversationsRead,
	useMoveConversationToTrash,
	useSetConversationSpam
} from '../ui-actions/conversation-actions';

type HandleKeyboardShortcutsProps = {
	event: KeyboardEvent;
	itemId: string;
	conversations: Array<{ id: string; flagged: boolean }>;
} & Pick<ConvActionPropType, 'folderId' | 'dispatch' | 'deselectAll'>;

const modifierKeysFirstTier: string[] = ['v', 'm', '.', 'n'];
const modifierKeysSecondTier: string[] = [];

let keySequence = '';
export const useKeyboardShortcuts = (): ((args: HandleKeyboardShortcutsProps) => void) => {
	const setConversationsSpam = useSetConversationSpam();
	const moveConversationToTrash = useMoveConversationToTrash();

	return useCallback(
		({ event, itemId, conversations, dispatch, deselectAll, folderId }) => {
			const conversationFlag = conversations.filter(
				(conversation) => conversation.id === itemId
			)?.[0]?.flagged;

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
							setConversationsFlag({ ids: [itemId], value: conversationFlag, dispatch }).onClick(
								event
							);
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
		[moveConversationToTrash, setConversationsSpam]
	);
};
