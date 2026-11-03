/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { $isListItemNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent } from '@lexical/utils';
import {
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_EDITOR,
	INDENT_CONTENT_COMMAND,
	KEY_TAB_COMMAND,
	OUTDENT_CONTENT_COMMAND
} from 'lexical';

export const ListTabIndentationPlugin = (): null => {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			editor.registerCommand(
				KEY_TAB_COMMAND,
				(event) => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) {
						return false;
					}
					const inListItem = selection
						.getNodes()
						.every((node) => $findMatchingParent(node, $isListItemNode) !== null);
					if (!inListItem) {
						return false;
					}
					event.preventDefault();
					return editor.dispatchCommand(
						event.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND,
						undefined
					);
				},
				COMMAND_PRIORITY_EDITOR
			),
		[editor]
	);

	return null;
};
