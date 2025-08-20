/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect } from 'react';

import { useKeyboardShortcutsForConv } from 'hooks/use-keyboard-shortcuts-for-conv';

type ConversationShortcutsRegisterProps = {
	conversationIds: Array<string>;
	folderId: string;
};

export const ConversationShortcutsRegister = ({
	conversationIds,
	folderId
}: ConversationShortcutsRegisterProps): null => {
	const keyboardActions = useKeyboardShortcutsForConv({
		conversationIds,
		folderId
	});
	const handleKeyDown = useCallback(
		(event: KeyboardEvent): void => {
			keyboardActions(event);
		},
		[keyboardActions]
	);
	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown, keyboardActions]);

	return null;
};
