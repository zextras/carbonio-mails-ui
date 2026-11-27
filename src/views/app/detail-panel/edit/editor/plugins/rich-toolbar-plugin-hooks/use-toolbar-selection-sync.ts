/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type MutableRefObject, useEffect, useRef, useState } from 'react';

import { $getSelectionStyleValueForProperty } from '@lexical/selection';
import { $getSelection, $isRangeSelection, type LexicalEditor, type RangeSelection } from 'lexical';

import { $getSelectedImageNode } from '../nodes/image-node';
import {
	$getSelectionBlockType,
	$readActiveFormatting,
	$selectionHasImage,
	ActiveFormatting,
	areActiveFormattingEqual,
	BlockType,
	DEFAULT_ACTIVE_FORMATTING
} from '../rich-toolbar-plugin-model';

type ToolbarSelectionSync = {
	isImageSelected: boolean;
	/** Whether the selection is exactly one image, which the image dialog then edits. */
	isSingleImageSelected: boolean;
	currentBlock: BlockType;
	activeFormatting: ActiveFormatting;
	currentFont: string;
	currentFontSize: string;
	currentTextColor: string;
	currentBackgroundColor: string;
	lastRangeSelectionRef: MutableRefObject<RangeSelection | null>;
};

/**
 * Keeps the toolbar in sync with the formatting at the caret: whether inline
 * images are selected (to toggle the alignment control) and whether a single one
 * is (to highlight the image dialog button), the active font / size / block
 * style (to reflect them in the selectors) and which toggle options (formats,
 * alignment, direction, list) are active.
 */
export function useToolbarSelectionSync(editor: LexicalEditor): ToolbarSelectionSync {
	const [isImageSelected, setIsImageSelected] = useState(false);
	const [isSingleImageSelected, setIsSingleImageSelected] = useState(false);
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
					setIsSingleImageSelected($getSelectedImageNode() !== null);
					setCurrentBlock($getSelectionBlockType());
					// A new object on every update (each keystroke) would re-render the whole
					// toolbar even though nothing it shows has changed.
					const nextFormatting = $readActiveFormatting();
					setActiveFormatting((previous) =>
						areActiveFormattingEqual(previous, nextFormatting) ? previous : nextFormatting
					);
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
		isSingleImageSelected,
		currentBlock,
		activeFormatting,
		currentFont,
		currentFontSize,
		currentTextColor,
		currentBackgroundColor,
		lastRangeSelectionRef
	};
}
