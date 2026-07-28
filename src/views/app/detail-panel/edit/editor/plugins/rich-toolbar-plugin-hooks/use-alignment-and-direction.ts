/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import {
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	type ElementFormatType,
	type ElementNode,
	FORMAT_ELEMENT_COMMAND,
	type LexicalEditor
} from 'lexical';

type AlignmentAndDirection = {
	formatAlign: (alignment: ElementFormatType) => void;
	setDirection: (direction: 'ltr' | 'rtl') => void;
};

export function useAlignmentAndDirection(editor: LexicalEditor): AlignmentAndDirection {
	const formatAlign = useCallback(
		(alignment: ElementFormatType): void => {
			editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
		},
		[editor]
	);

	const setDirection = useCallback(
		(direction: 'ltr' | 'rtl'): void => {
			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) {
					return;
				}
				const topLevelElements = new Map<string, ElementNode>();
				selection.getNodes().forEach((node) => {
					const topLevel = node.getTopLevelElement();
					if (topLevel && $isElementNode(topLevel)) {
						topLevelElements.set(topLevel.getKey(), topLevel);
					}
				});
				topLevelElements.forEach((element) => element.setDirection(direction));
			});
		},
		[editor]
	);

	return { formatAlign, setDirection };
}
