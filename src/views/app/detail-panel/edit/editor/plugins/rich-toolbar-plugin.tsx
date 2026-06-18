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
import {
	Button,
	Container,
	Dropdown,
	DropdownItem,
	Row,
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
import { useEditorAttachments } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';
import { getFonts, getFontSizesOptions } from 'views/settings/components/utils';

type RichToolbarPluginProps = {
	editorId: MailsEditorV2['id'];
};

type BlockType = 'paragraph' | 'quote' | HeadingTagType;

/**
 * The Carbonio Design System icon set does not include dedicated rich-text
 * formatting glyphs (bold, italic, alignment, indentation, ...). For every
 * toolbar action without a matching CDS icon we fall back to this placeholder,
 * so the toolbar layout mirrors the legacy TinyMCE one until proper icons are
 * available.
 */
const PLACEHOLDER_ICON = 'AlertTriangleOutline';

function $selectionHasImage(): boolean {
	const selection = $getSelection();
	return $isNodeSelection(selection) && selection.getNodes().some((node) => $isImageNode(node));
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
	icon: string;
	label: string;
	onClick: () => void;
};

const ToolbarIconButton = ({ icon, label, onClick }: ToolbarIconButtonProps): React.JSX.Element => (
	<Tooltip label={label}>
		<Button icon={icon} type="ghost" size="large" onClick={onClick} aria-label={label} />
	</Tooltip>
);

type ColorToolbarButtonProps = {
	icon: string;
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
			gap="extrasmall"
			width="fill"
		>
			{/* Font family / size / block style selectors */}
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
			<Dropdown items={blockItems}>
				<Button
					type="ghost"
					size="small"
					label={t('label.paragraph', 'Paragraph')}
					onClick={(): void => undefined}
				/>
			</Dropdown>

			<ToolbarDivider />

			{/* Text and background color */}
			<ColorToolbarButton
				icon={PLACEHOLDER_ICON}
				label={t('label.text_color', 'Text color')}
				onColorChange={(color): void => patchStyle({ color })}
			/>
			<ColorToolbarButton
				icon="BrushOutline"
				label={t('label.background_color', 'Background color')}
				onColorChange={(color): void => patchStyle({ 'background-color': color })}
			/>

			<ToolbarDivider />

			{/* Inline text formatting */}
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.bold', 'Bold')}
				onClick={(): void => formatText('bold')}
			/>
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.italic', 'Italic')}
				onClick={(): void => formatText('italic')}
			/>
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.underline', 'Underline')}
				onClick={(): void => formatText('underline')}
			/>
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.strikethrough', 'Strikethrough')}
				onClick={(): void => formatText('strikethrough')}
			/>
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.remove_format', 'Clear formatting')}
				onClick={(): void =>
					patchStyle({ color: '', 'background-color': '', 'font-size': '', 'font-family': '' })
				}
			/>

			<ToolbarDivider />

			{/* Paragraph alignment */}
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.align_left', 'Align left')}
				onClick={(): void => formatAlign('left')}
			/>
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.align_center', 'Center')}
				onClick={(): void => formatAlign('center')}
			/>
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.align_right', 'Align right')}
				onClick={(): void => formatAlign('right')}
			/>
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.align_justify', 'Justify')}
				onClick={(): void => formatAlign('justify')}
			/>

			{/* Indentation */}
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.indent_decrease', 'Decrease indent')}
				onClick={(): void => {
					editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
				}}
			/>
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.indent_increase', 'Increase indent')}
				onClick={(): void => {
					editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
				}}
			/>

			{/* Text direction */}
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.ltr', 'Left to right')}
				onClick={(): void => setDirection('ltr')}
			/>
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.rtl', 'Right to left')}
				onClick={(): void => setDirection('rtl')}
			/>

			<ToolbarDivider />

			{/* Lists */}
			<ToolbarIconButton
				icon="ListOutline"
				label={t('label.bullet_list', 'Bulleted list')}
				onClick={(): void => {
					editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
				}}
			/>
			<ToolbarIconButton
				icon={PLACEHOLDER_ICON}
				label={t('label.numbered_list', 'Numbered list')}
				onClick={(): void => {
					editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
				}}
			/>

			<ToolbarDivider />

			{/* Insert link / table / images */}
			<ToolbarIconButton icon="Link2Outline" label={t('label.link', 'Link')} onClick={insertLink} />
			<Tooltip label={tableLabel}>
				<Dropdown
					items={tableItems}
					forceOpen={tableMenuOpen}
					onClose={(): void => setTableMenuOpen(false)}
					disableAutoFocus
				>
					<Button
						icon="GridOutline"
						type="ghost"
						size="large"
						aria-label={tableLabel}
						onClick={(): void => setTableMenuOpen((open) => !open)}
					/>
				</Dropdown>
			</Tooltip>
			<ToolbarIconButton
				icon="ImageOutline"
				label={t('label.image', 'Image')}
				onClick={(): void => fileInputRef.current?.click()}
			/>
			<ToolbarIconButton
				icon="FileImageOutline"
				label={t('label.insert_image_url', 'Image from URL')}
				onClick={insertImageByUrl}
			/>
			{isImageSelected && (
				<Tooltip label={t('label.image_align', 'Align image')}>
					<Dropdown items={imageAlignItems}>
						<Button
							icon="ImageOutline"
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
				icon={PLACEHOLDER_ICON}
				label={t('label.special_character', 'Special character')}
				onClick={(): void => undefined}
			/>
			<ToolbarIconButton
				icon="SmileOutline"
				label={t('label.emoji', 'Emoji')}
				onClick={(): void => undefined}
			/>

			<ToolbarDivider />

			{/* Source code */}
			<ToolbarIconButton
				icon="CodeOutline"
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
