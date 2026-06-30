/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import {
	$isListNode,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	ListNode
} from '@lexical/list';
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
import { $getNearestNodeOfType } from '@lexical/utils';
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
	COMMAND_PRIORITY_LOW,
	type ElementFormatType,
	type ElementNode,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	INDENT_CONTENT_COMMAND,
	OUTDENT_CONTENT_COMMAND,
	type TextFormatType
} from 'lexical';

import { EmojiPicker, type Emoji } from './emoji-picker';
import { ImageModal } from './image-modal';
import {
	INSERT_INLINE_IMAGE_COMMAND,
	OPEN_IMAGE_MODAL_COMMAND,
	SET_INLINE_IMAGE_ALIGNMENT_COMMAND
} from './image-plugin';
import { LinkModal } from './link-modal';
import { $isImageNode, type ImageAlignment } from './nodes/image-node';
import { SourceCodeModal } from './source-code-modal';
import { SpecialCharacterPicker } from './special-character-picker';
import { TableGridPicker } from './table-grid-picker';
import { editorIcon } from '../icons/editor-icons';
import { useEditorAttachments } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';
import { getFonts, getFontSizesOptions } from 'views/settings/components/utils';

type RichToolbarPluginProps = {
	editorId: MailsEditorV2['id'];
	/** Whether the "Show blocks" view aid (dashed block outlines) is active. */
	showBlocks: boolean;
	/** Toggles the "Show blocks" view aid. */
	onToggleShowBlocks: () => void;
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

type TextFormatsState = {
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strikethrough: boolean;
};

type ActiveFormatting = {
	formats: TextFormatsState;
	align: ElementFormatType;
	direction: 'ltr' | 'rtl';
	list: 'bullet' | 'number' | null;
};

const DEFAULT_ACTIVE_FORMATTING: ActiveFormatting = {
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
function $readActiveFormatting(): ActiveFormatting {
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
	/**
	 * For toggle controls, whether the option is active for the current selection.
	 * When set, the button is highlighted and exposes `aria-pressed`; leave it
	 * undefined for plain action buttons.
	 */
	active?: boolean;
};

const ToolbarIconButton = ({
	icon,
	label,
	onClick,
	active
}: ToolbarIconButtonProps): React.JSX.Element => (
	<Tooltip label={label}>
		{active ? (
			<Button
				icon={icon}
				type="default"
				size="extralarge"
				onClick={onClick}
				aria-label={label}
				aria-pressed
				backgroundColor="highlight"
				labelColor="text"
			/>
		) : (
			<Button
				icon={icon}
				type="ghost"
				size="extralarge"
				onClick={onClick}
				aria-label={label}
				aria-pressed={active === undefined ? undefined : false}
				color="text"
			/>
		)}
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

// `styled()` drops the generic call signature of the design-system `Select`,
// which would type the `onChange` value as `{}` and reject the `<BlockType>`
// type argument; cast it back to keep `Select`'s generics.
const CustomSelect = styled(Select)`
	& > div > div {
		padding: 0.5rem;
		border-radius: 0.125rem;
		align-items: center;
	}

	& > div > div > div > div:first-child {
		padding-top: 0;
	}

	& [data-testid='divider'] {
		display: none;
	}
` as typeof Select;

export const RichToolbarPlugin = ({
	editorId,
	showBlocks,
	onToggleShowBlocks
}: RichToolbarPluginProps): React.JSX.Element => {
	const [editor] = useLexicalComposerContext();
	const { addInlineAttachments } = useEditorAttachments(editorId);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [tableMenuOpen, setTableMenuOpen] = useState(false);
	const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);
	const [specialCharMenuOpen, setSpecialCharMenuOpen] = useState(false);
	const [sourceCodeOpen, setSourceCodeOpen] = useState(false);
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [imageModalOpen, setImageModalOpen] = useState(false);
	const [isImageSelected, setIsImageSelected] = useState(false);
	const [currentFont, setCurrentFont] = useState('');
	const [currentFontSize, setCurrentFontSize] = useState('');
	const [currentBlock, setCurrentBlock] = useState<BlockType>('paragraph');
	const [activeFormatting, setActiveFormatting] =
		useState<ActiveFormatting>(DEFAULT_ACTIVE_FORMATTING);

	// Keep the toolbar in sync with the formatting at the caret: whether a single
	// inline image is selected (to toggle the alignment control), the active
	// font / size / block style (to reflect them in the selectors) and which
	// toggle options (formats, alignment, direction, list) are active.
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
					}
				});
			}),
		[editor]
	);

	// Let an image (e.g. on double-click) request the Insert/Edit Image dialog.
	useEffect(
		() =>
			editor.registerCommand(
				OPEN_IMAGE_MODAL_COMMAND,
				() => {
					setImageModalOpen(true);
					return true;
				},
				COMMAND_PRIORITY_LOW
			),
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

	const openImageModal = useCallback((): void => {
		setImageModalOpen(true);
	}, []);

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

	// When the caret carries no explicit font/size, fall back to the first option
	// of the corresponding selector so it always shows a concrete value.
	const defaultFont = useMemo<SelectItem>(() => fontSelectItems[0], [fontSelectItems]);

	const defaultFontSize = useMemo<SelectItem>(() => fontSizeSelectItems[0], [fontSizeSelectItems]);

	const selectedFont = useMemo<SelectItem>(
		() =>
			fontSelectItems.find(
				(item) => normalizeCssValue(item.value) === normalizeCssValue(currentFont)
			) ?? defaultFont,
		[currentFont, defaultFont, fontSelectItems]
	);

	const selectedFontSize = useMemo<SelectItem>(
		() =>
			fontSizeSelectItems.find(
				(item) => normalizeCssValue(item.value) === normalizeCssValue(currentFontSize)
			) ?? defaultFontSize,
		[currentFontSize, defaultFontSize, fontSizeSelectItems]
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

	const insertText = useCallback(
		(text: string): void => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					selection.insertText(text);
				}
			});
		},
		[editor]
	);

	const insertEmoji = useCallback(
		(emoji: Emoji): void => {
			insertText(emoji.native);
			setEmojiMenuOpen(false);
		},
		[insertText]
	);

	const insertSpecialCharacter = useCallback(
		(character: string): void => {
			insertText(character);
			setSpecialCharMenuOpen(false);
		},
		[insertText]
	);

	const emojiLabel = t('label.emoji', 'Emoji');

	const specialCharLabel = t('label.special_character', 'Special character');

	const emojiItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'emoji-picker',
				label: emojiLabel,
				keepOpen: true,
				customComponent: <EmojiPicker onEmojiSelect={insertEmoji} />
			}
		],
		[emojiLabel, insertEmoji]
	);

	const specialCharItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'special-character-picker',
				label: specialCharLabel,
				keepOpen: true,
				customComponent: <SpecialCharacterPicker onSelect={insertSpecialCharacter} />
			}
		],
		[insertSpecialCharacter, specialCharLabel]
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
				<CustomSelect
					items={fontSelectItems}
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
				<CustomSelect
					items={fontSizeSelectItems}
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
				<CustomSelect<BlockType>
					items={blockSelectItems}
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
				active={activeFormatting.formats.bold}
			/>
			<ToolbarIconButton
				icon={editorIcon('italic')}
				label={t('label.italic', 'Italic')}
				onClick={(): void => formatText('italic')}
				active={activeFormatting.formats.italic}
			/>
			<ToolbarIconButton
				icon={editorIcon('underline')}
				label={t('label.underline', 'Underline')}
				onClick={(): void => formatText('underline')}
				active={activeFormatting.formats.underline}
			/>
			<ToolbarIconButton
				icon={editorIcon('strike-through')}
				label={t('label.strikethrough', 'Strikethrough')}
				onClick={(): void => formatText('strikethrough')}
				active={activeFormatting.formats.strikethrough}
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
				active={activeFormatting.align === 'left'}
			/>
			<ToolbarIconButton
				icon={editorIcon('align-center')}
				label={t('label.align_center', 'Center')}
				onClick={(): void => formatAlign('center')}
				active={activeFormatting.align === 'center'}
			/>
			<ToolbarIconButton
				icon={editorIcon('align-right')}
				label={t('label.align_right', 'Align right')}
				onClick={(): void => formatAlign('right')}
				active={activeFormatting.align === 'right'}
			/>
			<ToolbarIconButton
				icon={editorIcon('align-justify')}
				label={t('label.align_justify', 'Justify')}
				onClick={(): void => formatAlign('justify')}
				active={activeFormatting.align === 'justify'}
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
				active={activeFormatting.direction === 'ltr'}
			/>
			<ToolbarIconButton
				icon={editorIcon('rtl')}
				label={t('label.rtl', 'Right to left')}
				onClick={(): void => setDirection('rtl')}
				active={activeFormatting.direction === 'rtl'}
			/>

			<ToolbarDivider />

			{/* Lists */}
			<ToolbarIconButton
				icon={editorIcon('unordered-list')}
				label={t('label.bullet_list', 'Bulleted list')}
				onClick={(): void => {
					editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
				}}
				active={activeFormatting.list === 'bullet'}
			/>
			<ToolbarIconButton
				icon={editorIcon('ordered-list')}
				label={t('label.numbered_list', 'Numbered list')}
				onClick={(): void => {
					editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
				}}
				active={activeFormatting.list === 'number'}
			/>

			<ToolbarDivider />

			{/* Insert link / table / images */}
			<ToolbarIconButton
				icon={editorIcon('link')}
				label={t('label.link', 'Link')}
				onClick={(): void => setLinkModalOpen(true)}
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
				onClick={openImageModal}
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
			<Tooltip label={specialCharLabel}>
				<Dropdown
					items={specialCharItems}
					forceOpen={specialCharMenuOpen}
					onClose={(): void => setSpecialCharMenuOpen(false)}
					width="fit-content"
					maxWidth="unset"
					disableAutoFocus
				>
					<Button
						icon={editorIcon('insert-character')}
						color="text"
						type="ghost"
						size="large"
						aria-label={specialCharLabel}
						onClick={(): void => setSpecialCharMenuOpen((open) => !open)}
					/>
				</Dropdown>
			</Tooltip>
			<Tooltip label={emojiLabel}>
				<Dropdown
					items={emojiItems}
					forceOpen={emojiMenuOpen}
					onClose={(): void => setEmojiMenuOpen(false)}
					width="fit-content"
					maxWidth="unset"
					disableAutoFocus
				>
					<Button
						icon={editorIcon('emoji')}
						color="text"
						type="ghost"
						size="large"
						aria-label={emojiLabel}
						onClick={(): void => setEmojiMenuOpen((open) => !open)}
					/>
				</Dropdown>
			</Tooltip>

			<ToolbarDivider />

			{/* Show blocks and source code */}
			<ToolbarIconButton
				icon={editorIcon('visualblocks')}
				label={t('label.show_blocks', 'Show blocks')}
				onClick={onToggleShowBlocks}
				active={showBlocks}
			/>
			<ToolbarIconButton
				icon={editorIcon('sourcecode')}
				label={t('label.source_code', 'Source code')}
				onClick={(): void => setSourceCodeOpen(true)}
			/>
			<SourceCodeModal
				editor={editor}
				open={sourceCodeOpen}
				onClose={(): void => setSourceCodeOpen(false)}
			/>
			<LinkModal
				editor={editor}
				open={linkModalOpen}
				onClose={(): void => setLinkModalOpen(false)}
			/>
			<ImageModal
				editor={editor}
				open={imageModalOpen}
				onClose={(): void => setImageModalOpen(false)}
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
