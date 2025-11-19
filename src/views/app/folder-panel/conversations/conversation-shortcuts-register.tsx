/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect } from 'react';

import { useIsFilePreviewOpen } from '../../../../hooks/use-is-file-preview-open';
import { useKeyboardShortcutsForConv } from 'hooks/use-keyboard-shortcuts-for-conv';
import { hasModalOverlay, isInputContext } from 'hooks/utils';

type ConversationShortcutsRegisterProps = {
	conversationIds: Array<string>;
	folderId: string;
};

/**
 * Registers global keyboard shortcuts for conversation actions.
 * This component doesn't render anything but manages event listeners.
 */
export const ConversationShortcutsRegister = ({
	conversationIds,
	folderId
}: ConversationShortcutsRegisterProps): null => {
	const isFilePreviewOpen = useIsFilePreviewOpen();
	const keyboardActions = useKeyboardShortcutsForConv({
		conversationIds,
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
	}, [handleKeyDown]);

	return null;
};
