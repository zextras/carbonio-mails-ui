/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useRef, useState } from 'react';

import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Button, Container, Dropdown, Row, Tooltip } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from 'lexical';

import { ColorPickerToolbarButton } from './color-picker-toolbar-button';
import { ImageModal } from './image-modal';
import { type ResolveInlineImages } from './image-plugin';
import { LinkModal } from './link-modal';
import { useAlignmentAndDirection } from './rich-toolbar-plugin-hooks/use-alignment-and-direction';
import { useBlockType } from './rich-toolbar-plugin-hooks/use-block-type';
import { useEmojiAndSpecialCharacters } from './rich-toolbar-plugin-hooks/use-emoji-and-special-characters';
import { useFontAndSizeSelects } from './rich-toolbar-plugin-hooks/use-font-and-size-selects';
import { useImageActions } from './rich-toolbar-plugin-hooks/use-image-actions';
import { useStylePatching } from './rich-toolbar-plugin-hooks/use-style-patching';
import { useTableInsert } from './rich-toolbar-plugin-hooks/use-table-insert';
import { useTextFormatting } from './rich-toolbar-plugin-hooks/use-text-formatting';
import { useToolbarSelectionSync } from './rich-toolbar-plugin-hooks/use-toolbar-selection-sync';
import { type BlockType } from './rich-toolbar-plugin-model';
import { SourceCodeModal } from './source-code-modal';
import { ToolbarDivider } from './toolbar-divider';
import { ToolbarIconButton } from './toolbar-icon-button';
import { ToolbarSelect } from './toolbar-select';
import { editorIcon } from '../icons/editor-icons';

export type { ResolvedInlineImage, ResolveInlineImages } from './image-plugin';

/**
 * The file input behind the "insert image from device" button is hidden (it is
 * driven by the button), so it can only be reached by test id.
 */
export const INLINE_IMAGE_FILE_INPUT_TESTID = 'inline-image-file-input';

type RichToolbarPluginProps = {
	/** Whether the "Show blocks" view aid (dashed block outlines) is active. */
	showBlocks: boolean;
	/** Toggles the "Show blocks" view aid. */
	onToggleShowBlocks: () => void;
	/**
	 * Resolves the image files picked from the "insert image from device" button
	 * into sources the editor can display (an upload in the mail composer, a
	 * `data:` URI in the signature editor). When omitted, that button is hidden —
	 * the store-agnostic "insert image from URL" button is always available.
	 */
	onResolveInlineImages?: ResolveInlineImages;
	/** Account's default font family, used as the font selector's default value. */
	fontFamily?: string;
	/** Account's default font size, used as the size selector's default value. */
	fontSize?: string;
};

export const RichToolbarPlugin = ({
	showBlocks,
	onToggleShowBlocks,
	onResolveInlineImages,
	fontFamily,
	fontSize
}: RichToolbarPluginProps): React.JSX.Element => {
	const [editor] = useLexicalComposerContext();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [sourceCodeOpen, setSourceCodeOpen] = useState(false);

	const {
		isImageSelected,
		currentBlock,
		activeFormatting,
		currentFont,
		currentFontSize,
		currentTextColor,
		currentBackgroundColor,
		lastRangeSelectionRef
	} = useToolbarSelectionSync(editor);

	const { patchStyle } = useStylePatching(editor, lastRangeSelectionRef);
	const { formatText, clearFormatting } = useTextFormatting(editor, lastRangeSelectionRef);
	const { formatAlign, setDirection } = useAlignmentAndDirection(editor);
	const { formatBlock, blockSelectItems, selectedBlock } = useBlockType(editor, currentBlock);
	const { fontSelectItems, fontSizeSelectItems, selectedFont, selectedFontSize } =
		useFontAndSizeSelects(currentFont, currentFontSize, fontFamily, fontSize);
	const {
		imageAlignItems,
		openImageModal,
		onImageFilesSelected,
		imageModalOpen,
		setImageModalOpen
	} = useImageActions(editor, onResolveInlineImages);
	const { tableItems, tableLabel, tableMenuOpen, setTableMenuOpen } = useTableInsert(editor);
	const {
		emojiItems,
		specialCharItems,
		emojiLabel,
		specialCharLabel,
		emojiMenuOpen,
		setEmojiMenuOpen,
		specialCharMenuOpen,
		setSpecialCharMenuOpen
	} = useEmojiAndSpecialCharacters(editor);

	const textColorLabel = t('lexical-label.text_color', 'Text color');
	const backgroundColorLabel = t('lexical-label.background_color', 'Background color');

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
				<ToolbarSelect
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
				<ToolbarSelect
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
				<ToolbarSelect<BlockType>
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
			<ColorPickerToolbarButton
				icon={editorIcon('text-color')}
				label={textColorLabel}
				color={currentTextColor}
				onColorChange={(color): void => patchStyle({ color })}
			/>
			<ColorPickerToolbarButton
				icon={editorIcon('highlight-bg-color')}
				label={backgroundColorLabel}
				color={currentBackgroundColor}
				onColorChange={(color): void => patchStyle({ 'background-color': color })}
			/>

			<ToolbarDivider />

			{/* Inline text formatting */}
			<ToolbarIconButton
				icon={editorIcon('bold')}
				label={t('lexical-label.bold', 'Bold')}
				onClick={(): void => formatText('bold')}
				active={activeFormatting.formats.bold}
			/>
			<ToolbarIconButton
				icon={editorIcon('italic')}
				label={t('lexical-label.italic', 'Italic')}
				onClick={(): void => formatText('italic')}
				active={activeFormatting.formats.italic}
			/>
			<ToolbarIconButton
				icon={editorIcon('underline')}
				label={t('lexical-label.underline', 'Underline')}
				onClick={(): void => formatText('underline')}
				active={activeFormatting.formats.underline}
			/>
			<ToolbarIconButton
				icon={editorIcon('strike-through')}
				label={t('lexical-label.strikethrough', 'Strikethrough')}
				onClick={(): void => formatText('strikethrough')}
				active={activeFormatting.formats.strikethrough}
			/>
			<ToolbarIconButton
				icon={editorIcon('remove-formatting')}
				label={t('lexical-label.remove_format', 'Clear formatting')}
				onClick={clearFormatting}
			/>

			<ToolbarDivider />

			{/* Paragraph alignment */}
			<ToolbarIconButton
				icon={editorIcon('align-left')}
				label={t('lexical-label.align_left', 'Align left')}
				onClick={(): void => formatAlign('left')}
				active={activeFormatting.align === 'left'}
			/>
			<ToolbarIconButton
				icon={editorIcon('align-center')}
				label={t('lexical-label.align_center', 'Center')}
				onClick={(): void => formatAlign('center')}
				active={activeFormatting.align === 'center'}
			/>
			<ToolbarIconButton
				icon={editorIcon('align-right')}
				label={t('lexical-label.align_right', 'Align right')}
				onClick={(): void => formatAlign('right')}
				active={activeFormatting.align === 'right'}
			/>
			<ToolbarIconButton
				icon={editorIcon('align-justify')}
				label={t('lexical-label.align_justify', 'Justify')}
				onClick={(): void => formatAlign('justify')}
				active={activeFormatting.align === 'justify'}
			/>

			{/* Indentation */}
			<ToolbarIconButton
				icon={editorIcon('outdent')}
				label={t('lexical-label.indent_decrease', 'Decrease indent')}
				onClick={(): void => {
					editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
				}}
			/>
			<ToolbarIconButton
				icon={editorIcon('indent')}
				label={t('lexical-label.indent_increase', 'Increase indent')}
				onClick={(): void => {
					editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
				}}
			/>

			{/* Text direction */}
			<ToolbarIconButton
				icon={editorIcon('ltr')}
				label={t('lexical-label.ltr', 'Left to right')}
				onClick={(): void => setDirection('ltr')}
				active={activeFormatting.direction === 'ltr'}
			/>
			<ToolbarIconButton
				icon={editorIcon('rtl')}
				label={t('lexical-label.rtl', 'Right to left')}
				onClick={(): void => setDirection('rtl')}
				active={activeFormatting.direction === 'rtl'}
			/>

			<ToolbarDivider />

			{/* Lists */}
			<ToolbarIconButton
				icon={editorIcon('unordered-list')}
				label={t('lexical-label.bullet_list', 'Bulleted list')}
				onClick={(): void => {
					editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
				}}
				active={activeFormatting.list === 'bullet'}
			/>
			<ToolbarIconButton
				icon={editorIcon('ordered-list')}
				label={t('lexical-label.numbered_list', 'Numbered list')}
				onClick={(): void => {
					editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
				}}
				active={activeFormatting.list === 'number'}
			/>

			<ToolbarDivider />

			{/* Insert link / table / images */}
			<ToolbarIconButton
				icon={editorIcon('link')}
				label={t('lexical-label.link', 'Link')}
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
			{onResolveInlineImages && (
				<ToolbarIconButton
					icon={editorIcon('image')}
					label={t('lexical-label.image', 'Image')}
					onClick={(): void => fileInputRef.current?.click()}
				/>
			)}
			<ToolbarIconButton
				icon={editorIcon('edit-image')}
				label={t('lexical-label.insert_image_url', 'Image from URL')}
				onClick={openImageModal}
			/>
			{isImageSelected && (
				<Tooltip label={t('lexical-label.image_align', 'Align image')}>
					<Dropdown items={imageAlignItems}>
						<Button
							icon={editorIcon('align-center')}
							type="ghost"
							size="large"
							aria-label={t('lexical-label.image_align', 'Align image')}
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
						onClick={(): void => setSpecialCharMenuOpen(!specialCharMenuOpen)}
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
						onClick={(): void => setEmojiMenuOpen(!emojiMenuOpen)}
					/>
				</Dropdown>
			</Tooltip>

			<ToolbarDivider />

			{/* Show blocks and source code */}
			<ToolbarIconButton
				icon={editorIcon('visualblocks')}
				label={t('lexical-label.show_blocks', 'Show blocks')}
				onClick={onToggleShowBlocks}
				active={showBlocks}
			/>
			<ToolbarIconButton
				icon={editorIcon('sourcecode')}
				label={t('lexical-label.source_code', 'Source code')}
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
				data-testid={INLINE_IMAGE_FILE_INPUT_TESTID}
				type="file"
				accept="image/*"
				multiple
				style={{ display: 'none' }}
				onChange={onImageFilesSelected}
				aria-hidden="true"
				tabIndex={-1}
			/>
		</Row>
	);
};
