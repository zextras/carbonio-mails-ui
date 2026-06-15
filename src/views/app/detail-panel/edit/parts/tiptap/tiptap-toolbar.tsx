/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import {
	Container,
	Divider,
	Dropdown,
	DropdownItem,
	Input,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { HexColorPicker } from 'react-colorful';

import { TipTapAccountSettingsPrefs } from './tiptap-types';
import useClickOutside from 'hooks/use-click-outside-picker';
import { getFonts, getFontSizesOptions } from 'views/settings/components/utils';

/*
 * NOTE: the visible glyph of every toolbar control is a TEXT PLACEHOLDER
 * (see `ToolbarButton` / dropdown triggers). Proper icons will be chosen and
 * wired in later - replace the `placeholder` strings / `<Text>` labels below.
 */

const DEFAULT_TEXT_COLOR = '#000000';
const DEFAULT_HIGHLIGHT_COLOR = '#ffff00';

const COMMON_EMOJIS = ['😀', '😁', '😂', '😉', '😍', '😎', '👍', '👏', '🙏', '🎉', '❤️', '🔥'];

const StyledToolbarButton = styled.button<{ $active?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 2rem;
	height: 2rem;
	padding: 0 0.375rem;
	border: none;
	border-radius: 0.25rem;
	cursor: ${({ disabled }): string => (disabled ? 'default' : 'pointer')};
	background-color: ${({ $active, theme }): string =>
		$active ? theme.palette.highlight.regular : 'transparent'};
	color: ${({ theme, disabled }): string =>
		disabled ? theme.palette.gray3.regular : theme.palette.text.regular};
	font-size: 0.75rem;
	&:hover {
		background-color: ${({ theme, disabled }): string =>
			disabled ? 'transparent' : theme.palette.gray5.regular};
	}
`;

const Popover = styled(Container)`
	position: absolute;
	top: calc(100% + 0.125rem);
	left: 0;
	z-index: 10;
	width: 15rem;
	padding: 0.5rem;
	border-radius: 0.5rem;
	box-shadow: 0 0.375rem 0.75rem rgba(0, 0, 0, 0.15);
	background-color: ${({ theme }): string => theme.palette.gray6.regular};
`;

const RelativeContainer = styled(Container)`
	position: relative;
`;

type ToolbarButtonProps = {
	tooltip: string;
	/** Text placeholder shown until a proper icon is wired in. */
	placeholder: string;
	active?: boolean;
	disabled?: boolean;
	onClick: () => void;
};

const ToolbarButton = ({
	tooltip,
	placeholder,
	active,
	disabled,
	onClick
}: ToolbarButtonProps): React.JSX.Element => (
	<Tooltip label={tooltip}>
		<StyledToolbarButton
			type="button"
			$active={active}
			disabled={disabled}
			onMouseDown={(e): void => e.preventDefault()}
			onClick={onClick}
			aria-label={tooltip}
		>
			{placeholder}
		</StyledToolbarButton>
	</Tooltip>
);

const ToolbarDivider = (): React.JSX.Element => (
	<Padding horizontal="extrasmall">
		<div style={{ width: '0.0625rem', height: '1.5rem', background: 'rgba(0,0,0,0.1)' }} />
	</Padding>
);

type ColorControlProps = {
	tooltip: string;
	placeholder: string;
	disabled?: boolean;
	color: string;
	onChange: (color: string) => void;
	onClear: () => void;
};

const ColorControl = ({
	tooltip,
	placeholder,
	disabled,
	color,
	onChange,
	onClear
}: ColorControlProps): React.JSX.Element => {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLInputElement>(null);
	const close = useCallback(() => setOpen(false), []);
	useClickOutside(ref, close);

	return (
		<RelativeContainer width="fit" height="fit" ref={ref}>
			<ToolbarButton
				tooltip={tooltip}
				placeholder={placeholder}
				disabled={disabled}
				onClick={(): void => setOpen((s) => !s)}
			/>
			{open && (
				<Popover height="fit" crossAlignment="flex-start">
					<HexColorPicker color={color} onChange={onChange} />
					<Padding top="small">
						<ToolbarButton
							tooltip={t('label.remove', 'Remove')}
							placeholder={t('label.remove', 'Remove')}
							onClick={(): void => {
								onClear();
								close();
							}}
						/>
					</Padding>
				</Popover>
			)}
		</RelativeContainer>
	);
};

type LinkControlProps = {
	disabled?: boolean;
	isActive: boolean;
	currentHref: string;
	onApply: (href: string) => void;
	onRemove: () => void;
};

const LinkControl = ({
	disabled,
	isActive,
	currentHref,
	onApply,
	onRemove
}: LinkControlProps): React.JSX.Element => {
	const [open, setOpen] = useState(false);
	const [href, setHref] = useState('');
	const ref = useRef<HTMLInputElement>(null);
	const close = useCallback(() => setOpen(false), []);
	useClickOutside(ref, close);

	const toggle = useCallback(() => {
		setHref(currentHref);
		setOpen((s) => !s);
	}, [currentHref]);

	return (
		<RelativeContainer width="fit" height="fit" ref={ref}>
			<ToolbarButton
				tooltip={t('label.link', 'Link')}
				placeholder={t('label.link', 'Link')}
				active={isActive}
				disabled={disabled}
				onClick={toggle}
			/>
			{open && (
				<Popover height="fit" crossAlignment="flex-start" gap="0.5rem">
					<Input
						label={t('label.link_address', 'Link address')}
						value={href}
						onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setHref(e.target.value)}
					/>
					<Row mainAlignment="space-between" width="100%" padding={{ top: 'small' }}>
						<ToolbarButton
							tooltip={t('label.remove', 'Remove')}
							placeholder={t('label.remove', 'Remove')}
							onClick={(): void => {
								onRemove();
								close();
							}}
						/>
						<ToolbarButton
							tooltip={t('label.apply', 'Apply')}
							placeholder={t('label.apply', 'Apply')}
							onClick={(): void => {
								onApply(href);
								close();
							}}
						/>
					</Row>
				</Popover>
			)}
		</RelativeContainer>
	);
};

export type TipTapToolbarProps = {
	editor: Editor | null;
	disabled?: boolean;
	accountSettingsPrefs: TipTapAccountSettingsPrefs;
	onFileSelect: (files: Array<File>) => void;
};

type ToolbarState = {
	isBold: boolean;
	isItalic: boolean;
	isUnderline: boolean;
	isStrike: boolean;
	isBulletList: boolean;
	isOrderedList: boolean;
	isLink: boolean;
	isAlignLeft: boolean;
	isAlignCenter: boolean;
	isAlignRight: boolean;
	isAlignJustify: boolean;
	currentHref: string;
};

const EMPTY_STATE: ToolbarState = {
	isBold: false,
	isItalic: false,
	isUnderline: false,
	isStrike: false,
	isBulletList: false,
	isOrderedList: false,
	isLink: false,
	isAlignLeft: false,
	isAlignCenter: false,
	isAlignRight: false,
	isAlignJustify: false,
	currentHref: ''
};

export const TipTapToolbar = ({
	editor,
	disabled = false,
	onFileSelect
}: TipTapToolbarProps): React.JSX.Element => {
	const imageInputRef = useRef<HTMLInputElement>(null);

	const state =
		useEditorState({
			editor,
			selector: ({ editor: e }): ToolbarState => {
				if (!e) {
					return EMPTY_STATE;
				}
				return {
					isBold: e.isActive('bold'),
					isItalic: e.isActive('italic'),
					isUnderline: e.isActive('underline'),
					isStrike: e.isActive('strike'),
					isBulletList: e.isActive('bulletList'),
					isOrderedList: e.isActive('orderedList'),
					isLink: e.isActive('link'),
					isAlignLeft: e.isActive({ textAlign: 'left' }),
					isAlignCenter: e.isActive({ textAlign: 'center' }),
					isAlignRight: e.isActive({ textAlign: 'right' }),
					isAlignJustify: e.isActive({ textAlign: 'justify' }),
					currentHref: e.getAttributes('link').href ?? ''
				};
			}
		}) ?? EMPTY_STATE;

	const run = useCallback(
		(command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>): void => {
			if (!editor) {
				return;
			}
			command(editor.chain().focus()).run();
		},
		[editor]
	);

	const fontFamilyItems = useMemo<Array<DropdownItem>>(
		() =>
			getFonts().map((font) => ({
				id: font.value,
				label: font.label,
				onClick: (): void => run((chain) => chain.setFontFamily(font.value))
			})),
		[run]
	);

	const fontSizeItems = useMemo<Array<DropdownItem>>(
		() =>
			getFontSizesOptions().map((size) => ({
				id: size,
				label: size,
				onClick: (): void => run((chain) => chain.setFontSize(size))
			})),
		[run]
	);

	const styleItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'p',
				label: t('label.paragraph', 'Paragraph'),
				onClick: (): void => run((c) => c.setParagraph())
			},
			{
				id: 'h1',
				label: t('label.heading_1', 'Heading 1'),
				onClick: (): void => run((c) => c.toggleHeading({ level: 1 }))
			},
			{
				id: 'h2',
				label: t('label.heading_2', 'Heading 2'),
				onClick: (): void => run((c) => c.toggleHeading({ level: 2 }))
			},
			{
				id: 'h3',
				label: t('label.heading_3', 'Heading 3'),
				onClick: (): void => run((c) => c.toggleHeading({ level: 3 }))
			},
			{
				id: 'h4',
				label: t('label.heading_4', 'Heading 4'),
				onClick: (): void => run((c) => c.toggleHeading({ level: 4 }))
			},
			{
				id: 'h5',
				label: t('label.heading_5', 'Heading 5'),
				onClick: (): void => run((c) => c.toggleHeading({ level: 5 }))
			},
			{
				id: 'h6',
				label: t('label.heading_6', 'Heading 6'),
				onClick: (): void => run((c) => c.toggleHeading({ level: 6 }))
			},
			{
				id: 'pre',
				label: t('label.preformatted', 'Pre'),
				onClick: (): void => run((c) => c.toggleCodeBlock())
			},
			{
				id: 'blockquote',
				label: t('label.blockquote', 'Blockquote'),
				onClick: (): void => run((c) => c.toggleBlockquote())
			}
		],
		[run]
	);

	const tableItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'insert',
				label: t('label.insert_table', 'Insert table'),
				onClick: (): void => run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))
			},
			{
				id: 'addRow',
				label: t('label.insert_row', 'Insert row'),
				onClick: (): void => run((c) => c.addRowAfter())
			},
			{
				id: 'addCol',
				label: t('label.insert_column', 'Insert column'),
				onClick: (): void => run((c) => c.addColumnAfter())
			},
			{
				id: 'delRow',
				label: t('label.delete_row', 'Delete row'),
				onClick: (): void => run((c) => c.deleteRow())
			},
			{
				id: 'delCol',
				label: t('label.delete_column', 'Delete column'),
				onClick: (): void => run((c) => c.deleteColumn())
			},
			{
				id: 'delTable',
				label: t('label.delete_table', 'Delete table'),
				onClick: (): void => run((c) => c.deleteTable())
			},
			{
				id: 'merge',
				label: t('label.merge_cells', 'Merge cells'),
				onClick: (): void => run((c) => c.mergeCells())
			},
			{
				id: 'split',
				label: t('label.split_cell', 'Split cell'),
				onClick: (): void => run((c) => c.splitCell())
			}
		],
		[run]
	);

	const emojiItems = useMemo<Array<DropdownItem>>(
		() =>
			COMMON_EMOJIS.map((emoji) => ({
				id: emoji,
				label: emoji,
				onClick: (): void => run((c) => c.insertContent(emoji))
			})),
		[run]
	);

	const onImageInputChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			const { files } = event.target;
			if (files && files.length > 0) {
				onFileSelect(Array.from(files));
			}
			event.target.value = '';
		},
		[onFileSelect]
	);

	return (
		<Container width="100%" height="fit" crossAlignment="flex-start" background="gray6">
			<Row
				width="100%"
				mainAlignment="flex-start"
				wrap="wrap"
				padding={{ vertical: 'extrasmall', horizontal: 'small' }}
			>
				<Dropdown items={fontFamilyItems} disabled={disabled}>
					<StyledToolbarButton type="button" disabled={disabled}>
						<Text size="small">{t('label.font', 'Font')}</Text>
					</StyledToolbarButton>
				</Dropdown>
				<Dropdown items={fontSizeItems} disabled={disabled}>
					<StyledToolbarButton type="button" disabled={disabled}>
						<Text size="small">{t('label.size', 'Size')}</Text>
					</StyledToolbarButton>
				</Dropdown>
				<Dropdown items={styleItems} disabled={disabled}>
					<StyledToolbarButton type="button" disabled={disabled}>
						<Text size="small">{t('label.styles', 'Styles')}</Text>
					</StyledToolbarButton>
				</Dropdown>

				<ToolbarDivider />

				<ToolbarButton
					tooltip={t('label.bold', 'Bold')}
					placeholder="B"
					active={state.isBold}
					disabled={disabled}
					onClick={(): void => run((c) => c.toggleBold())}
				/>
				<ToolbarButton
					tooltip={t('label.italic', 'Italic')}
					placeholder="I"
					active={state.isItalic}
					disabled={disabled}
					onClick={(): void => run((c) => c.toggleItalic())}
				/>
				<ToolbarButton
					tooltip={t('label.underline', 'Underline')}
					placeholder="U"
					active={state.isUnderline}
					disabled={disabled}
					onClick={(): void => run((c) => c.toggleUnderline())}
				/>
				<ToolbarButton
					tooltip={t('label.strikethrough', 'Strikethrough')}
					placeholder="S"
					active={state.isStrike}
					disabled={disabled}
					onClick={(): void => run((c) => c.toggleStrike())}
				/>
				<ToolbarButton
					tooltip={t('label.remove_format', 'Clear formatting')}
					placeholder="Tx"
					disabled={disabled}
					onClick={(): void => run((c) => c.unsetAllMarks().clearNodes())}
				/>

				<ToolbarDivider />

				<ColorControl
					tooltip={t('label.text_color', 'Text color')}
					placeholder="A"
					disabled={disabled}
					color={DEFAULT_TEXT_COLOR}
					onChange={(color): void => run((c) => c.setColor(color))}
					onClear={(): void => run((c) => c.unsetColor())}
				/>
				<ColorControl
					tooltip={t('label.highlight_color', 'Highlight color')}
					placeholder="H"
					disabled={disabled}
					color={DEFAULT_HIGHLIGHT_COLOR}
					onChange={(color): void => run((c) => c.toggleHighlight({ color }))}
					onClear={(): void => run((c) => c.unsetHighlight())}
				/>

				<ToolbarDivider />

				<ToolbarButton
					tooltip={t('label.align_left', 'Align left')}
					placeholder="L"
					active={state.isAlignLeft}
					disabled={disabled}
					onClick={(): void => run((c) => c.setTextAlign('left'))}
				/>
				<ToolbarButton
					tooltip={t('label.align_center', 'Align center')}
					placeholder="C"
					active={state.isAlignCenter}
					disabled={disabled}
					onClick={(): void => run((c) => c.setTextAlign('center'))}
				/>
				<ToolbarButton
					tooltip={t('label.align_right', 'Align right')}
					placeholder="R"
					active={state.isAlignRight}
					disabled={disabled}
					onClick={(): void => run((c) => c.setTextAlign('right'))}
				/>
				<ToolbarButton
					tooltip={t('label.align_justify', 'Justify')}
					placeholder="J"
					active={state.isAlignJustify}
					disabled={disabled}
					onClick={(): void => run((c) => c.setTextAlign('justify'))}
				/>

				<ToolbarDivider />

				<ToolbarButton
					tooltip={t('label.bullet_list', 'Bullet list')}
					placeholder="UL"
					active={state.isBulletList}
					disabled={disabled}
					onClick={(): void => run((c) => c.toggleBulletList())}
				/>
				<ToolbarButton
					tooltip={t('label.ordered_list', 'Numbered list')}
					placeholder="OL"
					active={state.isOrderedList}
					disabled={disabled}
					onClick={(): void => run((c) => c.toggleOrderedList())}
				/>

				<ToolbarDivider />

				<LinkControl
					disabled={disabled}
					isActive={state.isLink}
					currentHref={state.currentHref}
					onApply={(href): void => {
						if (href) {
							run((c) => c.extendMarkRange('link').setLink({ href }));
						}
					}}
					onRemove={(): void => run((c) => c.extendMarkRange('link').unsetLink())}
				/>
				<Dropdown items={tableItems} disabled={disabled}>
					<StyledToolbarButton type="button" disabled={disabled}>
						<Text size="small">{t('label.table', 'Table')}</Text>
					</StyledToolbarButton>
				</Dropdown>
				<ToolbarButton
					tooltip={t('label.insert_image', 'Insert image')}
					placeholder="Img"
					disabled={disabled}
					onClick={(): void => imageInputRef.current?.click()}
				/>
				<Dropdown items={emojiItems} disabled={disabled}>
					<StyledToolbarButton type="button" disabled={disabled}>
						<Text size="small">{t('label.emoji', 'Emoji')}</Text>
					</StyledToolbarButton>
				</Dropdown>

				<input
					ref={imageInputRef}
					type="file"
					accept="image/*"
					multiple
					style={{ display: 'none' }}
					data-testid="tiptap-image-input"
					onChange={onImageInputChange}
				/>
			</Row>
			<Divider color="gray3" />
		</Container>
	);
};
