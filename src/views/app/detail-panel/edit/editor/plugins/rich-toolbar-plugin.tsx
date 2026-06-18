/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$createHeadingNode,
	$createQuoteNode,
	$isHeadingNode,
	$isQuoteNode,
	type HeadingTagType
} from '@lexical/rich-text';
import {
	$getSelectionStyleValueForProperty,
	$patchStyleText,
	$setBlocksType
} from '@lexical/selection';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
	Button,
	Container,
	Dropdown,
	DropdownItem,
	type IconProps,
	Row,
	Select,
	SelectItem,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import {
	$createParagraphNode,
	$getSelection,
	$isElementNode,
	$isNodeSelection,
	$isRangeSelection,
	type ElementFormatType,
	type ElementNode,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	INDENT_CONTENT_COMMAND,
	OUTDENT_CONTENT_COMMAND,
	type TextFormatType
} from 'lexical';

import { INSERT_INLINE_IMAGE_COMMAND, SET_INLINE_IMAGE_ALIGNMENT_COMMAND } from './image-plugin';
import { $isImageNode, type ImageAlignment } from './nodes/image-node';
import { TableGridPicker } from './table-grid-picker';
import { editorIcon } from '../icons/editor-icons';
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

function $getSelectionBlockType(): BlockType {
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

const normalizeCssValue = (value: string): string =>
	value.toLowerCase().replace(/\s+/g, ' ').trim();

const ToolbarDivider = (): React.JSX.Element => (
	<Container
		width="0.0625rem"
		height="1.5rem"
		background={'gray3'}
		margin={{ left: 'extrasmall', right: 'extrasmall' }}
	/>
);

type ToolbarIconButtonProps = {
	icon: IconProps['icon'];
	label: string;
	onClick: () => void;
};

const ToolbarIconButton = ({ icon, label, onClick }: ToolbarIconButtonProps): React.JSX.Element => (
	<Tooltip label={label}>
		<Button
			icon={icon}
			type="ghost"
			size="large"
			onClick={onClick}
			aria-label={label}
			color="text"
		/>
	</Tooltip>
);

type ColorToolbarButtonProps = {
	icon: IconProps['icon'];
	label: string;
	onColorChange: (color: string) => void;
};

const ColorToolbarButton = ({
	icon,
	label,
	onColorChange
}: ColorToolbarButtonProps): React.JSX.Element => {
	const inputRef = useRef<HTMLInputElement>(null);
	return (
		<Container width="fit" height="fit" style={{ position: 'relative', display: 'inline-flex' }}>
			<ToolbarIconButton
				icon={icon}
				label={label}
				onClick={(): void => inputRef.current?.click()}
			/>
			<input
				ref={inputRef}
				type="color"
				aria-hidden
				tabIndex={-1}
				style={{
					position: 'absolute',
					left: 0,
					bottom: 0,
					width: '0.0625rem',
					height: '0.0625rem',
					padding: 0,
					margin: 0,
					border: 0,
					opacity: 0,
					pointerEvents: 'none'
				}}
				onChange={(event): void => onColorChange(event.target.value)}
			/>
		</Container>
	);
};

export const RichToolbarPlugin = ({ editorId }: RichToolbarPluginProps): React.JSX.Element => {
	const [editor] = useLexicalComposerContext();
	const { addInlineAttachments } = useEditorAttachments(editorId);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [tableMenuOpen, setTableMenuOpen] = useState(false);
	const [isImageSelected, setIsImageSelected] = useState(false);
	const [currentFont, setCurrentFont] = useState('');
	const [currentFontSize, setCurrentFontSize] = useState('');
	const [currentBlock, setCurrentBlock] = useState<BlockType>('paragraph');

	// Keep the toolbar in sync with the formatting at the caret: whether a single
	// inline image is selected (to toggle the alignment control) and the active
	// font / size / block style (to reflect them in the selectors).
	useEffect(
		() =>
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					setIsImageSelected($selectionHasImage());
					setCurrentBlock($getSelectionBlockType());
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						setCurrentFont($getSelectionStyleValueForProperty(selection, 'font-family', ''));
						setCurrentFontSize($getSelectionStyleValueForProperty(selection, 'font-size', ''));
					}
				});
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

	const insertImageByUrl = useCallback((): void => {
		// eslint-disable-next-line no-alert
		const url = window.prompt(t('label.insert_image_url', 'Image URL'));
		if (url) {
			editor.dispatchCommand(INSERT_INLINE_IMAGE_COMMAND, {
				src: url,
				cidUrl: undefined,
				altText: 'image'
			});
		}
	}, [editor]);

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

	const fontSelectItems = useMemo<Array<SelectItem>>(
		() => getFonts().map((font) => ({ label: font.label, value: font.value })),
		[]
	);

	const fontSizeSelectItems = useMemo<Array<SelectItem>>(
		() => getFontSizesOptions().map((size) => ({ label: size, value: size })),
		[]
	);

	const blockSelectItems = useMemo<Array<SelectItem<BlockType>>>(
		() => [
			{ label: t('label.paragraph', 'Paragraph'), value: 'paragraph' },
			{ label: t('label.heading_1', 'Heading 1'), value: 'h1' },
			{ label: t('label.heading_2', 'Heading 2'), value: 'h2' },
			{ label: t('label.heading_3', 'Heading 3'), value: 'h3' },
			{ label: t('label.heading_4', 'Heading 4'), value: 'h4' },
			{ label: t('label.heading_5', 'Heading 5'), value: 'h5' },
			{ label: t('label.heading_6', 'Heading 6'), value: 'h6' },
			{ label: t('label.blockquote', 'Blockquote'), value: 'quote' }
		],
		[]
	);

	// Controlled selections: match the formatting at the caret against the
	// available options, falling back to an empty placeholder so the selector
	// shows its label when no predefined option applies.
	const fontPlaceholder = useMemo<SelectItem>(() => ({ label: '', value: '' }), []);
	const selectedFont = useMemo<SelectItem>(
		() =>
			fontSelectItems.find(
				(item) => normalizeCssValue(item.value) === normalizeCssValue(currentFont)
			) ?? fontPlaceholder,
		[currentFont, fontPlaceholder, fontSelectItems]
	);
	const selectedFontSize = useMemo<SelectItem>(
		() =>
			fontSizeSelectItems.find(
				(item) => normalizeCssValue(item.value) === normalizeCssValue(currentFontSize)
			) ?? fontPlaceholder,
		[currentFontSize, fontPlaceholder, fontSizeSelectItems]
	);
	const selectedBlock = useMemo<SelectItem<BlockType>>(
		() => blockSelectItems.find((item) => item.value === currentBlock) ?? blockSelectItems[0],
		[blockSelectItems, currentBlock]
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

	const tableLabel = t('label.table', 'Table');

	const tableItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'table-grid',
				label: tableLabel,
				keepOpen: true,
				customComponent: <TableGridPicker onSelect={insertTable} />
			}
		],
		[insertTable, tableLabel]
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
			crossAlignment="center"
			wrap="wrap"
			padding={{ vertical: 'extrasmall' }}
			gap="0.25rem"
			width="fill"
		>
			<Container width="11.375rem" height="fit">
				<Select
					items={fontSelectItems}
					label={t('label.font', 'Font')}
					selection={selectedFont}
					onChange={(value): void => {
						if (value) {
							patchStyle({ 'font-family': value });
						}
					}}
					showCheckbox={false}
					dropdownWidth="12.5rem"
				/>
			</Container>
			<Container width="9.375rem" height="fit">
				<Select
					items={fontSizeSelectItems}
					label={t('label.size', 'Size')}
					selection={selectedFontSize}
					onChange={(value): void => {
						if (value) {
							patchStyle({ 'font-size': value });
						}
					}}
					showCheckbox={false}
				/>
			</Container>
			<Container width="9.375rem" height="fit">
				<Select<BlockType>
					items={blockSelectItems}
					label={t('label.paragraph', 'Paragraph')}
					selection={selectedBlock}
					onChange={(value): void => {
						if (value) {
							formatBlock(value);
						}
					}}
					showCheckbox={false}
				/>
			</Container>

			<ToolbarDivider />

			{/* Text and background color */}
			<ColorToolbarButton
				icon={editorIcon('text-color')}
				label={t('label.text_color', 'Text color')}
				onColorChange={(color): void => patchStyle({ color })}
			/>
			<ColorToolbarButton
				icon={editorIcon('highlight-bg-color')}
				label={t('label.background_color', 'Background color')}
				onColorChange={(color): void => patchStyle({ 'background-color': color })}
			/>

			<ToolbarDivider />

			{/* Inline text formatting */}
			<ToolbarIconButton
				icon={editorIcon('bold')}
				label={t('label.bold', 'Bold')}
				onClick={(): void => formatText('bold')}
			/>
			<ToolbarIconButton
				icon={editorIcon('italic')}
				label={t('label.italic', 'Italic')}
				onClick={(): void => formatText('italic')}
			/>
			<ToolbarIconButton
				icon={editorIcon('underline')}
				label={t('label.underline', 'Underline')}
				onClick={(): void => formatText('underline')}
			/>
			<ToolbarIconButton
				icon={editorIcon('strike-through')}
				label={t('label.strikethrough', 'Strikethrough')}
				onClick={(): void => formatText('strikethrough')}
			/>
			<ToolbarIconButton
				icon={editorIcon('remove-formatting')}
				label={t('label.remove_format', 'Clear formatting')}
				onClick={(): void =>
					patchStyle({ color: '', 'background-color': '', 'font-size': '', 'font-family': '' })
				}
			/>

			<ToolbarDivider />

			{/* Paragraph alignment */}
			<ToolbarIconButton
				icon={editorIcon('align-left')}
				label={t('label.align_left', 'Align left')}
				onClick={(): void => formatAlign('left')}
			/>
			<ToolbarIconButton
				icon={editorIcon('align-center')}
				label={t('label.align_center', 'Center')}
				onClick={(): void => formatAlign('center')}
			/>
			<ToolbarIconButton
				icon={editorIcon('align-right')}
				label={t('label.align_right', 'Align right')}
				onClick={(): void => formatAlign('right')}
			/>
			<ToolbarIconButton
				icon={editorIcon('align-justify')}
				label={t('label.align_justify', 'Justify')}
				onClick={(): void => formatAlign('justify')}
			/>

			{/* Indentation */}
			<ToolbarIconButton
				icon={editorIcon('outdent')}
				label={t('label.indent_decrease', 'Decrease indent')}
				onClick={(): void => {
					editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
				}}
			/>
			<ToolbarIconButton
				icon={editorIcon('indent')}
				label={t('label.indent_increase', 'Increase indent')}
				onClick={(): void => {
					editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
				}}
			/>

			{/* Text direction */}
			<ToolbarIconButton
				icon={editorIcon('ltr')}
				label={t('label.ltr', 'Left to right')}
				onClick={(): void => setDirection('ltr')}
			/>
			<ToolbarIconButton
				icon={editorIcon('rtl')}
				label={t('label.rtl', 'Right to left')}
				onClick={(): void => setDirection('rtl')}
			/>

			<ToolbarDivider />

			{/* Lists */}
			<ToolbarIconButton
				icon={editorIcon('unordered-list')}
				label={t('label.bullet_list', 'Bulleted list')}
				onClick={(): void => {
					editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
				}}
			/>
			<ToolbarIconButton
				icon={editorIcon('ordered-list')}
				label={t('label.numbered_list', 'Numbered list')}
				onClick={(): void => {
					editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
				}}
			/>

			<ToolbarDivider />

			{/* Insert link / table / images */}
			<ToolbarIconButton
				icon={editorIcon('link')}
				label={t('label.link', 'Link')}
				onClick={insertLink}
			/>
			<Tooltip label={tableLabel}>
				<Dropdown
					items={tableItems}
					forceOpen={tableMenuOpen}
					onClose={(): void => setTableMenuOpen(false)}
					disableAutoFocus
				>
					<Button
						icon={editorIcon('table')}
						color="text"
						type="ghost"
						size="large"
						aria-label={tableLabel}
						onClick={(): void => setTableMenuOpen((open) => !open)}
					/>
				</Dropdown>
			</Tooltip>
			<ToolbarIconButton
				icon={editorIcon('image')}
				label={t('label.image', 'Image')}
				onClick={(): void => fileInputRef.current?.click()}
			/>
			<ToolbarIconButton
				icon={editorIcon('edit-image')}
				label={t('label.insert_image_url', 'Image from URL')}
				onClick={insertImageByUrl}
			/>
			{isImageSelected && (
				<Tooltip label={t('label.image_align', 'Align image')}>
					<Dropdown items={imageAlignItems}>
						<Button
							icon={editorIcon('align-center')}
							type="ghost"
							size="large"
							aria-label={t('label.image_align', 'Align image')}
							onClick={(): void => undefined}
						/>
					</Dropdown>
				</Tooltip>
			)}

			<ToolbarDivider />

			{/* Special characters and emoji */}
			<ToolbarIconButton
				icon={editorIcon('insert-character')}
				label={t('label.special_character', 'Special character')}
				onClick={(): void => undefined}
			/>
			<ToolbarIconButton
				icon={editorIcon('emoji')}
				label={t('label.emoji', 'Emoji')}
				onClick={(): void => undefined}
			/>

			<ToolbarDivider />

			{/* Source code */}
			<ToolbarIconButton
				icon={editorIcon('sourcecode')}
				label={t('label.source_code', 'Source code')}
				onClick={(): void => undefined}
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
