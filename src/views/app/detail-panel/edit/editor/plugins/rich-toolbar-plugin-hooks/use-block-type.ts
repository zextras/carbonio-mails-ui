/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { type SelectItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	type LexicalEditor
} from 'lexical';

import { type BlockType } from '../rich-toolbar-plugin-model';

type BlockTypeControls = {
	formatBlock: (blockType: BlockType) => void;
	blockSelectItems: Array<SelectItem<BlockType>>;
	selectedBlock: SelectItem<BlockType>;
};

export function useBlockType(editor: LexicalEditor, currentBlock: BlockType): BlockTypeControls {
	const formatBlock = useCallback(
		(blockType: BlockType): void => {
			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) {
					return;
				}
				if (blockType === 'paragraph') {
					$setBlocksType(selection, () => $createParagraphNode());
				} else if (blockType === 'quote') {
					$setBlocksType(selection, () => $createQuoteNode());
				} else {
					$setBlocksType(selection, () => $createHeadingNode(blockType));
				}
			});
		},
		[editor]
	);

	const blockSelectItems = useMemo<Array<SelectItem<BlockType>>>(
		() => [
			{ label: t('lexical-label.paragraph', 'Paragraph'), value: 'paragraph' },
			{ label: t('lexical-label.heading_1', 'Heading 1'), value: 'h1' },
			{ label: t('lexical-label.heading_2', 'Heading 2'), value: 'h2' },
			{ label: t('lexical-label.heading_3', 'Heading 3'), value: 'h3' },
			{ label: t('lexical-label.heading_4', 'Heading 4'), value: 'h4' },
			{ label: t('lexical-label.heading_5', 'Heading 5'), value: 'h5' },
			{ label: t('lexical-label.heading_6', 'Heading 6'), value: 'h6' },
			{ label: t('lexical-label.blockquote', 'Blockquote'), value: 'quote' }
		],
		[]
	);

	const selectedBlock = useMemo<SelectItem<BlockType>>(
		() => blockSelectItems.find((item) => item.value === currentBlock) ?? blockSelectItems[0],
		[blockSelectItems, currentBlock]
	);

	return { formatBlock, blockSelectItems, selectedBlock };
}
