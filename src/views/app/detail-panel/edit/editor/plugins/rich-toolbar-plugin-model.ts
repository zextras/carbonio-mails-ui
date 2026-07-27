/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { $isListNode, ListNode } from '@lexical/list';
import { $isHeadingNode, $isQuoteNode, type HeadingTagType } from '@lexical/rich-text';
import { $getNearestNodeOfType } from '@lexical/utils';
import {
	$getSelection,
	$isElementNode,
	$isNodeSelection,
	$isRangeSelection,
	type ElementFormatType
} from 'lexical';

import { $isImageNode } from './nodes/image-node';

export type BlockType = 'paragraph' | 'quote' | HeadingTagType;

export function $selectionHasImage(): boolean {
	const selection = $getSelection();
	return $isNodeSelection(selection) && selection.getNodes().some((node) => $isImageNode(node));
}

export function $getSelectionBlockType(): BlockType {
	const selection = $getSelection();
	if (!$isRangeSelection(selection)) {
		return 'paragraph';
	}
	const anchorNode = selection.anchor.getNode();
	const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElement();
	if ($isHeadingNode(element)) {
		return element.getTag();
	}
	if ($isQuoteNode(element)) {
		return 'quote';
	}
	return 'paragraph';
}

export const normalizeCssValue = (value: string): string =>
	value.toLowerCase().replace(/\s+/g, ' ').trim();

export type TextFormatsState = {
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strikethrough: boolean;
};

export type ActiveFormatting = {
	formats: TextFormatsState;
	align: ElementFormatType;
	direction: 'ltr' | 'rtl';
	list: 'bullet' | 'number' | null;
};

export const DEFAULT_ACTIVE_FORMATTING: ActiveFormatting = {
	formats: { bold: false, italic: false, underline: false, strikethrough: false },
	align: 'left',
	direction: 'ltr',
	list: null
};

/**
 * Reads, for the current caret/selection, which toggle toolbar options are
 * active: the inline text formats, the paragraph alignment, the text direction
 * and the list type. Mirrors the legacy toolbar, where the matching control is
 * highlighted. Must be called inside an editor read.
 */
export function $readActiveFormatting(): ActiveFormatting {
	const selection = $getSelection();
	if (!$isRangeSelection(selection)) {
		return DEFAULT_ACTIVE_FORMATTING;
	}
	const anchorNode = selection.anchor.getNode();
	const topNode =
		anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
	const topElement = $isElementNode(topNode) ? topNode : null;
	const listNode = $getNearestNodeOfType(anchorNode, ListNode);

	let list: ActiveFormatting['list'] = null;
	if ($isListNode(listNode)) {
		list = listNode.getListType() === 'number' ? 'number' : 'bullet';
	}

	return {
		formats: {
			bold: selection.hasFormat('bold'),
			italic: selection.hasFormat('italic'),
			underline: selection.hasFormat('underline'),
			strikethrough: selection.hasFormat('strikethrough')
		},
		// An unset element format and direction default to left / ltr, matching how
		// the content actually renders.
		align: (topElement ? topElement.getFormatType() : '') || 'left',
		direction: topElement?.getDirection() === 'rtl' ? 'rtl' : 'ltr',
		list
	};
}
