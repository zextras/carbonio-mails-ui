/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect } from 'react';

import { useIsFilePreviewOpen } from '../../../../hooks/use-is-file-preview-open';
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
	const isFilePreviewOpen = useIsFilePreviewOpen();
	const keyboardActions = useKeyboardShortcutsForMsg({
		messageIds,
		folderId
	});

	const handleKeyDown = useCallback(
		(event: KeyboardEvent): void => {
			const isInputField = isInputContext(event.target);

			/*
			 * Ignore shortcuts when typing in form fields
			 * or when a modal overlay is present
			 * or when file preview is open
			 */
			if (isInputField || hasModalOverlay() || isFilePreviewOpen) {
				return;
			}

			keyboardActions(event);
		},
		[isFilePreviewOpen, keyboardActions]
	);
	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown, keyboardActions]);

	return null;
};
