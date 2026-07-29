/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type MutableRefObject, useEffect, useRef, useState } from 'react';

import { $getSelectionStyleValueForProperty } from '@lexical/selection';
import { $getSelection, $isRangeSelection, type LexicalEditor, type RangeSelection } from 'lexical';

import {
	$getSelectionBlockType,
	$readActiveFormatting,
	$selectionHasImage,
	ActiveFormatting,
	BlockType,
	DEFAULT_ACTIVE_FORMATTING
} from '../rich-toolbar-plugin-model';

type ToolbarSelectionSync = {
	isImageSelected: boolean;
	currentBlock: BlockType;
	activeFormatting: ActiveFormatting;
	currentFont: string;
	currentFontSize: string;
	currentTextColor: string;
	currentBackgroundColor: string;
	lastRangeSelectionRef: MutableRefObject<RangeSelection | null>;
};

/**
 * Keeps the toolbar in sync with the formatting at the caret: whether a single
 * inline image is selected (to toggle the alignment control), the active
 * font / size / block style (to reflect them in the selectors) and which
 * toggle options (formats, alignment, direction, list) are active.
 */
export function useToolbarSelectionSync(editor: LexicalEditor): ToolbarSelectionSync {
	const [isImageSelected, setIsImageSelected] = useState(false);
	const [currentFont, setCurrentFont] = useState('');
	const [currentFontSize, setCurrentFontSize] = useState('');
	const [currentTextColor, setCurrentTextColor] = useState('');
	const [currentBackgroundColor, setCurrentBackgroundColor] = useState('');
	const [currentBlock, setCurrentBlock] = useState<BlockType>('paragraph');
	const [activeFormatting, setActiveFormatting] =
		useState<ActiveFormatting>(DEFAULT_ACTIVE_FORMATTING);
	const lastRangeSelectionRef = useRef<RangeSelection | null>(null);

	useEffect(
		() =>
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					setIsImageSelected($selectionHasImage());
					setCurrentBlock($getSelectionBlockType());
					setActiveFormatting($readActiveFormatting());
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						setCurrentFont($getSelectionStyleValueForProperty(selection, 'font-family', ''));
						setCurrentFontSize($getSelectionStyleValueForProperty(selection, 'font-size', ''));
						setCurrentTextColor($getSelectionStyleValueForProperty(selection, 'color', ''));
						setCurrentBackgroundColor(
							$getSelectionStyleValueForProperty(selection, 'background-color', '')
						);
						lastRangeSelectionRef.current = selection.clone();
					}
				});
			}),
		[editor]
	);

	return {
		isImageSelected,
		currentBlock,
		activeFormatting,
		currentFont,
		currentFontSize,
		currentTextColor,
		currentBackgroundColor,
		lastRangeSelectionRef
	};
}
