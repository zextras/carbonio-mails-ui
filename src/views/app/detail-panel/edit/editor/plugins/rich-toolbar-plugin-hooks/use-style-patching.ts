/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type MutableRefObject, useCallback } from 'react';

import { $patchStyleText } from '@lexical/selection';
import {
	$getSelection,
	$isRangeSelection,
	$setSelection,
	type LexicalEditor,
	type RangeSelection
} from 'lexical';

type StylePatching = {
	patchStyle: (styles: Record<string, string>) => void;
};

export function useStylePatching(
	editor: LexicalEditor,
	lastRangeSelectionRef: MutableRefObject<RangeSelection | null>
): StylePatching {
	const patchStyle = useCallback(
		(styles: Record<string, string>): void => {
			editor.update(() => {
				const selection = $getSelection();
				// Fall back to the last known valid selection: the color inputs open a
				// native, focus-stealing dialog, which by the time it resolves may have
				// left the live selection null even though the user's intent still
				// targets the text they had selected before opening it.
				const targetSelection = $isRangeSelection(selection)
					? selection
					: lastRangeSelectionRef.current;
				if ($isRangeSelection(targetSelection)) {
					// $patchStyleText resolves the nodes to style via $getSelection()
					// internally rather than the selection argument, so the target
					// selection must be (re)installed as the active selection first.
					$setSelection(targetSelection);
					$patchStyleText(targetSelection, styles);
				}
			});
		},
		[editor, lastRangeSelectionRef]
	);

	return { patchStyle };
}
