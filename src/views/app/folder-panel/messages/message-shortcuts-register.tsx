/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect } from 'react';

import { useKeyboardShortcutsForMsg } from 'hooks/use-keyboard-shortcuts-for-msg';

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
