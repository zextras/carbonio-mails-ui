/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect } from 'react';

import { useKeyboardShortcutsForMsg } from 'hooks/use-keyboard-shortcuts-for-msg';
import { hasModalOverlay, isInputContext } from 'hooks/utils';

type MessageShortcutsRegisterProps = {
	messageIds: Array<string>;
	folderId: string;
};

export const MessageShortcutsRegister = ({
	messageIds,
	folderId
}: MessageShortcutsRegisterProps): null => {
	const keyboardActions = useKeyboardShortcutsForMsg({
		messageIds,
		folderId
	});
	const handleKeyDown = useCallback(
		(event: KeyboardEvent): void => {
			const isInputField = isInputContext(event.target);

			// Ignore shortcuts when typing in form fields
			// or when a modal overlay is present
			if (isInputField || hasModalOverlay()) {
				return;
			}

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
