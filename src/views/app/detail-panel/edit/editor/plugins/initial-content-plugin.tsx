/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useRef } from 'react';

import { $generateNodesFromDOM } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $insertNodes } from 'lexical';

type InitialContentPluginProps = {
	html: string;
};

/**
 * Loads the initial draft HTML into the Lexical editor exactly once on mount.
 *
 * The update is tagged with `history-merge` so that `OnChangePlugin` (which
 * ignores that tag by default) does not treat the initial load as a user edit
 * and mark the draft as dirty.
 */
export const InitialContentPlugin = ({ html }: InitialContentPluginProps): null => {
	const [editor] = useLexicalComposerContext();
	const loaded = useRef(false);

	useEffect(() => {
		if (loaded.current || !html) {
			return;
		}
		loaded.current = true;

		editor.update(
			() => {
				const dom = new DOMParser().parseFromString(html, 'text/html');
				const nodes = $generateNodesFromDOM(editor, dom);
				const root = $getRoot();
				root.clear();
				root.select();
				$insertNodes(nodes);
			},
			{ tag: 'history-merge' }
		);
	}, [editor, html]);

	return null;
};
