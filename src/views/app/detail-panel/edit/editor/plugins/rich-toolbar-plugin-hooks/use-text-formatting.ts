/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type MutableRefObject, useCallback } from 'react';

import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $forEachSelectedTextNode } from '@lexical/selection';
import {
	$createParagraphNode,
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	$setSelection,
	type ElementNode,
	FORMAT_TEXT_COMMAND,
	type LexicalEditor,
	type RangeSelection,
	type TextFormatType
} from 'lexical';

type TextFormatting = {
	formatText: (format: TextFormatType) => void;
	clearFormatting: () => void;
};

export function useTextFormatting(
	editor: LexicalEditor,
	lastRangeSelectionRef: MutableRefObject<RangeSelection | null>
): TextFormatting {
	const formatText = useCallback(
		(format: TextFormatType): void => {
			editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
		},
		[editor]
	);

	const clearFormatting = useCallback((): void => {
		editor.update(() => {
			const selection = $getSelection();
			const targetSelection = $isRangeSelection(selection)
				? selection
				: lastRangeSelectionRef.current;
			if ($isRangeSelection(targetSelection)) {
				$setSelection(targetSelection);

				const blocksToReset = new Map<string, ElementNode>();
				targetSelection.getNodes().forEach((node) => {
					const topLevel = node.getTopLevelElement();
					if ($isElementNode(topLevel) && ($isHeadingNode(topLevel) || $isQuoteNode(topLevel))) {
						blocksToReset.set(topLevel.getKey(), topLevel);
					}
				});

				$forEachSelectedTextNode((textNode) => {
					textNode.setFormat(0);
					textNode.setStyle('');
				});

				blocksToReset.forEach((block) => block.replace($createParagraphNode(), true));
			}
		});
	}, [editor, lastRangeSelectionRef]);

	return { formatText, clearFormatting };
}
