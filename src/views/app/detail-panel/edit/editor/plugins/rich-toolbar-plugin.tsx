/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from '@lexical/rich-text';
import { $patchStyleText, $setBlocksType } from '@lexical/selection';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { Button, Dropdown, DropdownItem, Row } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import {
	$createParagraphNode,
	$getSelection,
	$isNodeSelection,
	$isRangeSelection,
	type ElementFormatType,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	REDO_COMMAND,
	type TextFormatType,
	UNDO_COMMAND
} from 'lexical';

import { INSERT_INLINE_IMAGE_COMMAND, SET_INLINE_IMAGE_ALIGNMENT_COMMAND } from './image-plugin';
import { $isImageNode, type ImageAlignment } from './nodes/image-node';
import { TableGridPicker } from './table-grid-picker';
import { useEditorAttachments } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';
import { getFonts, getFontSizesOptions } from 'views/settings/components/utils';

type RichToolbarPluginProps = {
	editorId: MailsEditorV2['id'];
};

type BlockType = 'paragraph' | 'quote' | HeadingTagType;

function $selectionHasImage(): boolean {
	const selection = $getSelection();
	return $isNodeSelection(selection) && selection.getNodes().some((node) => $isImageNode(node));
}

export const RichToolbarPlugin = ({ editorId }: RichToolbarPluginProps): React.JSX.Element => {
	const [editor] = useLexicalComposerContext();
	const { addInlineAttachments } = useEditorAttachments(editorId);
	const colorInputRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [tableMenuOpen, setTableMenuOpen] = useState(false);
	const [isImageSelected, setIsImageSelected] = useState(false);

	// Track whether the current selection is a single inline image, so the image
	// alignment control can be shown only when relevant.
	useEffect(
		() =>
			editor.registerUpdateListener(({ editorState }) => {
				setIsImageSelected(editorState.read($selectionHasImage));
			}),
		[editor]
	);

	const alignImage = useCallback(
		(alignment: ImageAlignment): void => {
			editor.dispatchCommand(SET_INLINE_IMAGE_ALIGNMENT_COMMAND, alignment);
		},
		[editor]
	);

	const formatText = useCallback(
		(format: TextFormatType): void => {
			editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
		},
		[editor]
	);

	const formatAlign = useCallback(
		(alignment: ElementFormatType): void => {
			editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
		},
		[editor]
	);

	const patchStyle = useCallback(
		(styles: Record<string, string>): void => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$patchStyleText(selection, styles);
				}
			});
		},
		[editor]
	);

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

	const insertLink = useCallback((): void => {
		// eslint-disable-next-line no-alert
		const url = window.prompt(t('label.insert_link_url', 'Link URL'));
		editor.dispatchCommand(TOGGLE_LINK_COMMAND, url || null);
	}, [editor]);

	const onColorSelected = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			patchStyle({ color: event.target.value });
		},
		[patchStyle]
	);

	const onImageFilesSelected = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			const fileList = event.target.files;
			if (!fileList?.length) {
				return;
			}
			addInlineAttachments(Array.from(fileList), {
				onSaveComplete: (inlineAttachments) => {
					inlineAttachments.forEach((attachment) => {
						if (attachment.downloadServiceUrl) {
							editor.dispatchCommand(INSERT_INLINE_IMAGE_COMMAND, {
								src: attachment.downloadServiceUrl,
								cidUrl: attachment.cidUrl,
								altText: 'Inline attachment'
							});
						}
					});
				}
			});
			event.target.value = '';
		},
		[addInlineAttachments, editor]
	);

	const blockItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'paragraph',
				label: t('label.paragraph', 'Paragraph'),
				onClick: () => formatBlock('paragraph')
			},
			{ id: 'h1', label: t('label.heading_1', 'Heading 1'), onClick: () => formatBlock('h1') },
			{ id: 'h2', label: t('label.heading_2', 'Heading 2'), onClick: () => formatBlock('h2') },
			{ id: 'h3', label: t('label.heading_3', 'Heading 3'), onClick: () => formatBlock('h3') },
			{ id: 'h4', label: t('label.heading_4', 'Heading 4'), onClick: () => formatBlock('h4') },
			{ id: 'h5', label: t('label.heading_5', 'Heading 5'), onClick: () => formatBlock('h5') },
			{ id: 'h6', label: t('label.heading_6', 'Heading 6'), onClick: () => formatBlock('h6') },
			{
				id: 'quote',
				label: t('label.blockquote', 'Blockquote'),
				onClick: () => formatBlock('quote')
			}
		],
		[formatBlock]
	);

	const fontItems = useMemo<Array<DropdownItem>>(
		() =>
			getFonts().map((font) => ({
				id: font.value,
				label: font.label,
				onClick: () => patchStyle({ 'font-family': font.value })
			})),
		[patchStyle]
	);

	const fontSizeItems = useMemo<Array<DropdownItem>>(
		() =>
			getFontSizesOptions().map((size) => ({
				id: size,
				label: size,
				onClick: () => patchStyle({ 'font-size': size })
			})),
		[patchStyle]
	);

	const alignItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'left',
				label: t('label.align_left', 'Align left'),
				onClick: () => formatAlign('left')
			},
			{
				id: 'center',
				label: t('label.align_center', 'Center'),
				onClick: () => formatAlign('center')
			},
			{
				id: 'right',
				label: t('label.align_right', 'Align right'),
				onClick: () => formatAlign('right')
			},
			{
				id: 'justify',
				label: t('label.align_justify', 'Justify'),
				onClick: () => formatAlign('justify')
			}
		],
		[formatAlign]
	);

	const listItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'bullet',
				label: t('label.bullet_list', 'Bulleted list'),
				onClick: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
			},
			{
				id: 'number',
				label: t('label.numbered_list', 'Numbered list'),
				onClick: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
			}
		],
		[editor]
	);

	const insertTable = useCallback(
		(rows: number, columns: number): void => {
			editor.dispatchCommand(INSERT_TABLE_COMMAND, {
				rows: String(rows),
				columns: String(columns),
				includeHeaders: false
			});
			setTableMenuOpen(false);
		},
		[editor]
	);

	const tableItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'table-grid',
				label: t('label.table', 'Table'),
				keepOpen: true,
				customComponent: <TableGridPicker onSelect={insertTable} />
			}
		],
		[insertTable]
	);

	const imageAlignItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'image-left',
				label: t('label.align_left', 'Align left'),
				onClick: () => alignImage('left')
			},
			{
				id: 'image-center',
				label: t('label.align_center', 'Center'),
				onClick: () => alignImage('center')
			},
			{
				id: 'image-right',
				label: t('label.align_right', 'Align right'),
				onClick: () => alignImage('right')
			}
		],
		[alignImage]
	);

	return (
		<Row
			mainAlignment="flex-start"
			wrap="wrap"
			padding={{ vertical: 'extrasmall' }}
			gap="extrasmall"
			width="fill"
		>
			<Dropdown items={blockItems}>
				<Button
					type="ghost"
					size="small"
					label={t('label.style', 'Style')}
					onClick={(): void => undefined}
				/>
			</Dropdown>
			<Dropdown items={fontItems}>
				<Button
					type="ghost"
					size="small"
					label={t('label.font', 'Font')}
					onClick={(): void => undefined}
				/>
			</Dropdown>
			<Dropdown items={fontSizeItems}>
				<Button
					type="ghost"
					size="small"
					label={t('label.size', 'Size')}
					onClick={(): void => undefined}
				/>
			</Dropdown>
			<Button
				type="ghost"
				size="small"
				label={t('label.bold', 'Bold')}
				onClick={(): void => formatText('bold')}
			/>
			<Button
				type="ghost"
				size="small"
				label={t('label.italic', 'Italic')}
				onClick={(): void => formatText('italic')}
			/>
			<Button
				type="ghost"
				size="small"
				label={t('label.underline', 'Underline')}
				onClick={(): void => formatText('underline')}
			/>
			<Button
				type="ghost"
				size="small"
				label={t('label.strikethrough', 'Strikethrough')}
				onClick={(): void => formatText('strikethrough')}
			/>
			<Button
				type="ghost"
				size="small"
				label={t('label.color', 'Color')}
				onClick={(): void => colorInputRef.current?.click()}
			/>
			<Button
				type="ghost"
				size="small"
				label={t('label.remove_format', 'Clear')}
				onClick={(): void => patchStyle({ color: '', 'font-size': '', 'font-family': '' })}
			/>
			<Dropdown items={alignItems}>
				<Button
					type="ghost"
					size="small"
					label={t('label.align', 'Align')}
					onClick={(): void => undefined}
				/>
			</Dropdown>
			<Dropdown items={listItems}>
				<Button
					type="ghost"
					size="small"
					label={t('label.list', 'List')}
					onClick={(): void => undefined}
				/>
			</Dropdown>
			<Dropdown
				items={tableItems}
				forceOpen={tableMenuOpen}
				onClose={(): void => setTableMenuOpen(false)}
				disableAutoFocus
			>
				<Button
					type="ghost"
					size="small"
					icon="GridOutline"
					label={t('label.table', 'Table')}
					onClick={(): void => setTableMenuOpen((open) => !open)}
				/>
			</Dropdown>
			<Button type="ghost" size="small" label={t('label.link', 'Link')} onClick={insertLink} />
			<Button
				type="ghost"
				size="small"
				icon="ImageOutline"
				label={t('label.image', 'Image')}
				onClick={(): void => fileInputRef.current?.click()}
			/>
			{isImageSelected && (
				<Dropdown items={imageAlignItems}>
					<Button
						type="ghost"
						size="small"
						icon="ImageOutline"
						label={t('label.image_align', 'Align image')}
						onClick={(): void => undefined}
					/>
				</Dropdown>
			)}
			<Button
				type="ghost"
				size="small"
				label={t('label.undo', 'Undo')}
				onClick={(): void => {
					editor.dispatchCommand(UNDO_COMMAND, undefined);
				}}
			/>
			<Button
				type="ghost"
				size="small"
				label={t('label.redo', 'Redo')}
				onClick={(): void => {
					editor.dispatchCommand(REDO_COMMAND, undefined);
				}}
			/>
			<input
				ref={colorInputRef}
				type="color"
				style={{ display: 'none' }}
				onChange={onColorSelected}
			/>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				style={{ display: 'none' }}
				onChange={onImageFilesSelected}
			/>
		</Row>
	);
};
