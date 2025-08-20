/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { useKeyboardShortcutsForConv } from 'hooks/use-keyboard-shortcuts-for-conv';

type ConversationShortcutsRegisterProps = {
	conversationId: string;
	folderId: string;
};

export const ConversationShortcutsRegister = ({
	conversationId,
	folderId
}: ConversationShortcutsRegisterProps): null => {
	const keyboardActions = useKeyboardShortcutsForConv({
		conversationId,
		folderId
	});

	useEffect(() => {
		const handler = (event: KeyboardEvent): void => keyboardActions(event);
		document.addEventListener('keydown', handler);
		return () => {
			document.removeEventListener('keydown', handler);
		};
	}, [keyboardActions]);

	return null;
};
