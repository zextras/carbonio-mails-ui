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
	Dropdown,
	DropdownItem,
	Icon,
	Input,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { HexColorPicker } from 'react-colorful';

import {
	AlignGlyph,
	BoldGlyph,
	CharmapGlyph,
	ClearFormatGlyph,
	DirectionGlyph,
	ForeColorGlyph,
	IndentGlyph,
	ItalicGlyph,
	NumberedListGlyph,
	StrikethroughGlyph,
	UnderlineGlyph,
	VisualBlocksGlyph
} from './tiptap-toolbar-glyphs';
import { TipTapAccountSettingsPrefs } from './tiptap-types';
import useClickOutside from 'hooks/use-click-outside-picker';
import { getFonts, getFontSizesOptions } from 'views/settings/components/utils';

const DEFAULT_TEXT_COLOR = '#000000';
const DEFAULT_HIGHLIGHT_COLOR = '#ffff00';

const SPECIAL_CHARS = [
	'©',
	'®',
	'™',
	'§',
	'¶',
	'†',
	'‡',
	'•',
	'…',
	'‰',
	'€',
	'£',
	'¥',
	'¢',
	'°',
	'±',
	'×',
	'÷',
	'≤',
	'≥',
	'≠',
	'≈',
	'∞',
	'µ',
	'α',
	'β',
	'π',
	'Ω',
	'→',
	'←',
	'↑',
	'↓',
	'«',
	'»',
	'“',
	'”',
	'‘',
	'’',
	'—',
	'–'
];

const BULLET_STYLES: Array<{ value: string; label: string }> = [
	{ value: 'disc', label: 'Disc' },
	{ value: 'circle', label: 'Circle' },
	{ value: 'square', label: 'Square' }
];
const ORDERED_STYLES: Array<{ value: string; label: string }> = [
	{ value: 'decimal', label: '1, 2, 3' },
	{ value: 'lower-alpha', label: 'a, b, c' },
	{ value: 'upper-alpha', label: 'A, B, C' },
	{ value: 'lower-roman', label: 'i, ii, iii' },
	{ value: 'upper-roman', label: 'I, II, III' }
];

const Bar = styled(Row)`
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
`;

const Group = styled(Row)`
	&:not(:last-of-type) {
		border-right: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	}
`;

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
	&:hover {
		background-color: ${({ theme, disabled, $active }): string =>
			// eslint-disable-next-line no-nested-ternary
			disabled
				? 'transparent'
				: $active
					? theme.palette.highlight.regular
					: theme.palette.gray5.regular};
	}
`;

const Popover = styled(Container)`
	position: absolute;
	top: calc(100% + 0.125rem);
	left: 0;
	z-index: 10;
	width: fit-content;
	min-width: 12.5rem;
	padding: 0.5rem;
	border-radius: 0.5rem;
	box-shadow: 0 0.375rem 0.75rem rgba(0, 0, 0, 0.15);
	background-color: ${({ theme }): string => theme.palette.gray6.regular};
`;

const RelativeContainer = styled(Container)`
	position: relative;
`;

const Chevron = (): React.JSX.Element => (
	<Icon icon="ChevronDownOutline" size="small" style={{ marginLeft: '0.125rem' }} />
);

type ToolbarButtonProps = {
	tooltip: string;
	active?: boolean;
	disabled?: boolean;
	onClick: () => void;
	children: React.ReactNode;
};

const ToolbarButton = ({
	tooltip,
	active,
	disabled,
	onClick,
	children
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
			{children}
		</StyledToolbarButton>
	</Tooltip>
);

const IconLabel = ({ icon }: { icon: string }): React.JSX.Element => (
	<Icon icon={icon} size="medium" />
);

type DropdownButtonProps = {
	tooltip: string;
	label: React.ReactNode;
	items: Array<DropdownItem>;
	disabled?: boolean;
};

const DropdownButton = ({
	tooltip,
	label,
	items,
	disabled
}: DropdownButtonProps): React.JSX.Element => (
	<Tooltip label={tooltip}>
		<Dropdown items={items} disabled={disabled} disableAutoFocus>
			<StyledToolbarButton type="button" disabled={disabled} aria-label={tooltip}>
				{label}
				<Chevron />
			</StyledToolbarButton>
		</Dropdown>
	</Tooltip>
);

type SplitButtonProps = {
	tooltip: string;
	active?: boolean;
	disabled?: boolean;
	onPrimary: () => void;
	menuItems: Array<DropdownItem>;
	children: React.ReactNode;
};

/** Icon area performs the primary action; the chevron area opens a menu. */
const SplitButton = ({
	tooltip,
	active,
	disabled,
	onPrimary,
	menuItems,
	children
}: SplitButtonProps): React.JSX.Element => (
	<Row>
		<ToolbarButton tooltip={tooltip} active={active} disabled={disabled} onClick={onPrimary}>
			{children}
		</ToolbarButton>
		<Dropdown items={menuItems} disabled={disabled} disableAutoFocus>
			<StyledToolbarButton type="button" disabled={disabled} style={{ minWidth: '1rem' }}>
				<Icon icon="ChevronDownOutline" size="small" />
			</StyledToolbarButton>
		</Dropdown>
	</Row>
);

type ColorControlProps = {
	tooltip: string;
	disabled?: boolean;
	color: string;
	glyph: (color: string) => React.ReactNode;
	onChange: (color: string) => void;
	onClear: () => void;
};

const ColorControl = ({
	tooltip,
	disabled,
	color,
	glyph,
	onChange,
	onClear
}: ColorControlProps): React.JSX.Element => {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLInputElement>(null);
	const close = useCallback(() => setOpen(false), []);
	useClickOutside(ref, close);

	return (
		<RelativeContainer width="fit" height="fit" ref={ref}>
			<Tooltip label={tooltip}>
				<StyledToolbarButton
					type="button"
					disabled={disabled}
					aria-label={tooltip}
					onMouseDown={(e): void => e.preventDefault()}
					onClick={(): void => setOpen((s) => !s)}
				>
					{glyph(color)}
					<Chevron />
				</StyledToolbarButton>
			</Tooltip>
			{open && (
				<Popover height="fit" crossAlignment="flex-start" gap="0.5rem">
					<HexColorPicker color={color} onChange={onChange} />
					<ToolbarButton
						tooltip={t('label.remove', 'Remove')}
						onClick={(): void => {
							onClear();
							close();
						}}
					>
						<Text size="small">{t('label.remove', 'Remove')}</Text>
					</ToolbarButton>
				</Popover>
			)}
		</RelativeContainer>
	);
};

type PopoverInputControlProps = {
	tooltip: string;
	icon: string;
	active?: boolean;
	disabled?: boolean;
	inputLabel: string;
	initialValue?: string;
	confirmLabel: string;
	onConfirm: (value: string) => void;
	onRemove?: () => void;
};

const PopoverInputControl = ({
	tooltip,
	icon,
	active,
	disabled,
	inputLabel,
	initialValue = '',
	confirmLabel,
	onConfirm,
	onRemove
}: PopoverInputControlProps): React.JSX.Element => {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState('');
	const ref = useRef<HTMLInputElement>(null);
	const close = useCallback(() => setOpen(false), []);
	useClickOutside(ref, close);

	const toggle = useCallback(() => {
		setValue(initialValue);
		setOpen((s) => !s);
	}, [initialValue]);

	return (
		<RelativeContainer width="fit" height="fit" ref={ref}>
			<ToolbarButton tooltip={tooltip} active={active} disabled={disabled} onClick={toggle}>
				<IconLabel icon={icon} />
			</ToolbarButton>
			{open && (
				<Popover height="fit" crossAlignment="flex-start" gap="0.5rem">
					<Input
						label={inputLabel}
						value={value}
						onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setValue(e.target.value)}
					/>
					<Row mainAlignment="space-between" width="100%" padding={{ top: 'small' }}>
						{onRemove && (
							<ToolbarButton
								tooltip={t('label.remove', 'Remove')}
								onClick={(): void => {
									onRemove();
									close();
								}}
							>
								<Text size="small">{t('label.remove', 'Remove')}</Text>
							</ToolbarButton>
						)}
						<ToolbarButton
							tooltip={confirmLabel}
							onClick={(): void => {
								if (value) {
									onConfirm(value);
								}
								close();
							}}
						>
							<Text size="small">{confirmLabel}</Text>
						</ToolbarButton>
					</Row>
				</Popover>
			)}
		</RelativeContainer>
	);
};

type CharmapControlProps = {
	disabled?: boolean;
	onInsert: (char: string) => void;
};

const CharGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(8, 1.75rem);
	gap: 0.125rem;
`;

const CharmapControl = ({ disabled, onInsert }: CharmapControlProps): React.JSX.Element => {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLInputElement>(null);
	const close = useCallback(() => setOpen(false), []);
	useClickOutside(ref, close);

	return (
		<RelativeContainer width="fit" height="fit" ref={ref}>
			<ToolbarButton
				tooltip={t('label.special_characters', 'Special characters')}
				disabled={disabled}
				onClick={(): void => setOpen((s) => !s)}
			>
				<CharmapGlyph />
			</ToolbarButton>
			{open && (
				<Popover height="fit" crossAlignment="flex-start">
					<CharGrid>
						{SPECIAL_CHARS.map((char) => (
							<StyledToolbarButton
								key={char}
								type="button"
								onMouseDown={(e): void => e.preventDefault()}
								onClick={(): void => {
									onInsert(char);
									close();
								}}
							>
								{char}
							</StyledToolbarButton>
						))}
					</CharGrid>
				</Popover>
			)}
		</RelativeContainer>
	);
};

const EMOJIS = ['😀', '😁', '😂', '😉', '😍', '😎', '👍', '👏', '🙏', '🎉', '❤️', '🔥'];

export type TipTapToolbarProps = {
	editor: Editor | null;
	disabled?: boolean;
	accountSettingsPrefs: TipTapAccountSettingsPrefs;
	onFileSelect: (files: Array<File>) => void;
	sourceView: boolean;
	onToggleSourceView: () => void;
	visualBlocks: boolean;
	onToggleVisualBlocks: () => void;
};

type ToolbarState = {
	isBold: boolean;
	isItalic: boolean;
	isUnderline: boolean;
	isStrike: boolean;
	isBulletList: boolean;
	isOrderedList: boolean;
	isLink: boolean;
	align: string;
	dir: string;
	currentHref: string;
	fontFamily: string;
	fontSize: string;
	blockLabel: string;
};

const EMPTY_STATE: ToolbarState = {
	isBold: false,
	isItalic: false,
	isUnderline: false,
	isStrike: false,
	isBulletList: false,
	isOrderedList: false,
	isLink: false,
	align: 'left',
	dir: 'ltr',
	currentHref: '',
	fontFamily: '',
	fontSize: '',
	blockLabel: ''
};

type BlockLabels = {
	paragraph: string;
	h1: string;
	h2: string;
	h3: string;
	h4: string;
	h5: string;
	h6: string;
	pre: string;
	blockquote: string;
};

const getBlockLabel = (e: Editor, labels: BlockLabels): string => {
	const headingLabels = [labels.h1, labels.h2, labels.h3, labels.h4, labels.h5, labels.h6];
	for (let level = 1; level <= 6; level += 1) {
		if (e.isActive('heading', { level })) {
			return headingLabels[level - 1];
		}
	}
	if (e.isActive('codeBlock')) {
		return labels.pre;
	}
	if (e.isActive('blockquote')) {
		return labels.blockquote;
	}
	return labels.paragraph;
};

const getAlign = (e: Editor): string => {
	if (e.isActive({ textAlign: 'center' })) {
		return 'center';
	}
	if (e.isActive({ textAlign: 'right' })) {
		return 'right';
	}
	if (e.isActive({ textAlign: 'justify' })) {
		return 'justify';
	}
	return 'left';
};

export const TipTapToolbar = ({
	editor,
	disabled = false,
	onFileSelect,
	sourceView,
	onToggleSourceView,
	visualBlocks,
	onToggleVisualBlocks
}: TipTapToolbarProps): React.JSX.Element => {
	const imageInputRef = useRef<HTMLInputElement>(null);

	const blockStyleLabels = useMemo(
		() => ({
			paragraph: t('label.paragraph', 'Paragraph'),
			h1: t('label.heading_1', 'Heading 1'),
			h2: t('label.heading_2', 'Heading 2'),
			h3: t('label.heading_3', 'Heading 3'),
			h4: t('label.heading_4', 'Heading 4'),
			h5: t('label.heading_5', 'Heading 5'),
			h6: t('label.heading_6', 'Heading 6'),
			pre: t('label.preformatted', 'Pre'),
			blockquote: t('label.blockquote', 'Blockquote')
		}),
		[]
	);

	const fonts = useMemo(() => getFonts(), []);

	const state =
		useEditorState({
			editor,
			selector: ({ editor: e }): ToolbarState => {
				if (!e) {
					return EMPTY_STATE;
				}
				const fontValue = e.getAttributes('textStyle').fontFamily ?? '';
				return {
					isBold: e.isActive('bold'),
					isItalic: e.isActive('italic'),
					isUnderline: e.isActive('underline'),
					isStrike: e.isActive('strike'),
					isBulletList: e.isActive('bulletList'),
					isOrderedList: e.isActive('orderedList'),
					isLink: e.isActive('link'),
					align: getAlign(e),
					dir: e.isActive({ dir: 'rtl' }) ? 'rtl' : 'ltr',
					currentHref: e.getAttributes('link').href ?? '',
					fontFamily: fonts.find((f) => f.value === fontValue)?.label ?? '',
					fontSize: e.getAttributes('textStyle').fontSize ?? '',
					blockLabel: getBlockLabel(e, blockStyleLabels)
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

	const controlsDisabled = disabled || sourceView;

	const fontFamilyItems = useMemo<Array<DropdownItem>>(
		() =>
			fonts.map((font) => ({
				id: font.value,
				label: font.label,
				onClick: (): void => run((c) => c.setFontFamily(font.value))
			})),
		[fonts, run]
	);

	const fontSizeItems = useMemo<Array<DropdownItem>>(
		() =>
			getFontSizesOptions().map((size) => ({
				id: size,
				label: size,
				onClick: (): void => run((c) => c.setFontSize(size))
			})),
		[run]
	);

	const styleItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'p',
				label: blockStyleLabels.paragraph,
				onClick: (): void => run((c) => c.setParagraph())
			},
			{
				id: 'h1',
				label: blockStyleLabels.h1,
				onClick: (): void => run((c) => c.toggleHeading({ level: 1 }))
			},
			{
				id: 'h2',
				label: blockStyleLabels.h2,
				onClick: (): void => run((c) => c.toggleHeading({ level: 2 }))
			},
			{
				id: 'h3',
				label: blockStyleLabels.h3,
				onClick: (): void => run((c) => c.toggleHeading({ level: 3 }))
			},
			{
				id: 'h4',
				label: blockStyleLabels.h4,
				onClick: (): void => run((c) => c.toggleHeading({ level: 4 }))
			},
			{
				id: 'h5',
				label: blockStyleLabels.h5,
				onClick: (): void => run((c) => c.toggleHeading({ level: 5 }))
			},
			{
				id: 'h6',
				label: blockStyleLabels.h6,
				onClick: (): void => run((c) => c.toggleHeading({ level: 6 }))
			},
			{
				id: 'pre',
				label: blockStyleLabels.pre,
				onClick: (): void => run((c) => c.toggleCodeBlock())
			},
			{
				id: 'blockquote',
				label: blockStyleLabels.blockquote,
				onClick: (): void => run((c) => c.toggleBlockquote())
			}
		],
		[blockStyleLabels, run]
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

	const bulletStyleItems = useMemo<Array<DropdownItem>>(
		() =>
			BULLET_STYLES.map((style) => ({
				id: style.value,
				label: style.label,
				onClick: (): void => {
					run((c) =>
						(state.isBulletList ? c : c.toggleBulletList()).updateAttributes('bulletList', {
							listStyleType: style.value
						})
					);
				}
			})),
		[run, state.isBulletList]
	);

	const orderedStyleItems = useMemo<Array<DropdownItem>>(
		() =>
			ORDERED_STYLES.map((style) => ({
				id: style.value,
				label: style.label,
				onClick: (): void => {
					run((c) =>
						(state.isOrderedList ? c : c.toggleOrderedList()).updateAttributes('orderedList', {
							listStyleType: style.value
						})
					);
				}
			})),
		[run, state.isOrderedList]
	);

	const emojiItems = useMemo<Array<DropdownItem>>(
		() =>
			EMOJIS.map((emoji) => ({
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

	const pickImageFile = useCallback(() => imageInputRef.current?.click(), []);

	return (
		<Container width="100%" height="fit" crossAlignment="flex-start" background="gray6">
			<Bar
				width="100%"
				mainAlignment="flex-start"
				wrap="wrap"
				padding={{ vertical: 'extrasmall', horizontal: 'small' }}
			>
				{/* Font family / size / block style */}
				<Group mainAlignment="flex-start" padding={{ right: 'extrasmall' }}>
					<DropdownButton
						tooltip={t('label.font', 'Font')}
						label={<Text size="small">{state.fontFamily || t('label.font', 'Font')}</Text>}
						items={fontFamilyItems}
						disabled={controlsDisabled}
					/>
					<DropdownButton
						tooltip={t('label.font_size', 'Font size')}
						label={<Text size="small">{state.fontSize || t('label.size', 'Size')}</Text>}
						items={fontSizeItems}
						disabled={controlsDisabled}
					/>
					<DropdownButton
						tooltip={t('label.styles', 'Styles')}
						label={<Text size="small">{state.blockLabel || blockStyleLabels.paragraph}</Text>}
						items={styleItems}
						disabled={controlsDisabled}
					/>
				</Group>

				{/* Colors */}
				<Group mainAlignment="flex-start" padding={{ horizontal: 'extrasmall' }}>
					<ColorControl
						tooltip={t('label.text_color', 'Text color')}
						disabled={controlsDisabled}
						color={DEFAULT_TEXT_COLOR}
						glyph={(color): React.ReactNode => <ForeColorGlyph color={color} />}
						onChange={(color): void => run((c) => c.setColor(color))}
						onClear={(): void => run((c) => c.unsetColor())}
					/>
					<ColorControl
						tooltip={t('label.highlight_color', 'Highlight color')}
						disabled={controlsDisabled}
						color={DEFAULT_HIGHLIGHT_COLOR}
						glyph={(): React.ReactNode => <IconLabel icon="Brush" />}
						onChange={(color): void => run((c) => c.toggleHighlight({ color }))}
						onClear={(): void => run((c) => c.unsetHighlight())}
					/>
				</Group>

				{/* Inline formatting */}
				<Group mainAlignment="flex-start" padding={{ horizontal: 'extrasmall' }}>
					<ToolbarButton
						tooltip={t('label.bold', 'Bold')}
						active={state.isBold}
						disabled={controlsDisabled}
						onClick={(): void => run((c) => c.toggleBold())}
					>
						<BoldGlyph />
					</ToolbarButton>
					<ToolbarButton
						tooltip={t('label.italic', 'Italic')}
						active={state.isItalic}
						disabled={controlsDisabled}
						onClick={(): void => run((c) => c.toggleItalic())}
					>
						<ItalicGlyph />
					</ToolbarButton>
					<ToolbarButton
						tooltip={t('label.underline', 'Underline')}
						active={state.isUnderline}
						disabled={controlsDisabled}
						onClick={(): void => run((c) => c.toggleUnderline())}
					>
						<UnderlineGlyph />
					</ToolbarButton>
					<ToolbarButton
						tooltip={t('label.strikethrough', 'Strikethrough')}
						active={state.isStrike}
						disabled={controlsDisabled}
						onClick={(): void => run((c) => c.toggleStrike())}
					>
						<StrikethroughGlyph />
					</ToolbarButton>
					<ToolbarButton
						tooltip={t('label.remove_format', 'Clear formatting')}
						disabled={controlsDisabled}
						onClick={(): void => run((c) => c.unsetAllMarks().clearNodes())}
					>
						<ClearFormatGlyph />
					</ToolbarButton>
				</Group>

				{/* Alignment / indentation / direction */}
				<Group mainAlignment="flex-start" padding={{ horizontal: 'extrasmall' }}>
					<ToolbarButton
						tooltip={t('label.align_left', 'Align left')}
						active={state.align === 'left'}
						disabled={controlsDisabled}
						onClick={(): void => run((c) => c.setTextAlign('left'))}
					>
						<AlignGlyph variant="left" />
					</ToolbarButton>
					<ToolbarButton
						tooltip={t('label.align_center', 'Align center')}
						active={state.align === 'center'}
						disabled={controlsDisabled}
						onClick={(): void => run((c) => c.setTextAlign('center'))}
					>
						<AlignGlyph variant="center" />
					</ToolbarButton>
					<ToolbarButton
						tooltip={t('label.align_right', 'Align right')}
						active={state.align === 'right'}
						disabled={controlsDisabled}
						onClick={(): void => run((c) => c.setTextAlign('right'))}
					>
						<AlignGlyph variant="right" />
					</ToolbarButton>
					<ToolbarButton
						tooltip={t('label.align_justify', 'Justify')}
						active={state.align === 'justify'}
						disabled={controlsDisabled}
						onClick={(): void => run((c) => c.setTextAlign('justify'))}
					>
						<AlignGlyph variant="justify" />
					</ToolbarButton>
					<ToolbarButton
						tooltip={t('label.outdent', 'Decrease indent')}
						disabled={controlsDisabled}
						onClick={(): void =>
							run((c) => (editor?.isActive('listItem') ? c.liftListItem('listItem') : c.outdent()))
						}
					>
						<IndentGlyph direction="outdent" />
					</ToolbarButton>
					<ToolbarButton
						tooltip={t('label.indent', 'Increase indent')}
						disabled={controlsDisabled}
						onClick={(): void =>
							run((c) => (editor?.isActive('listItem') ? c.sinkListItem('listItem') : c.indent()))
						}
					>
						<IndentGlyph direction="indent" />
					</ToolbarButton>
					<ToolbarButton
						tooltip={t('label.ltr', 'Left to right')}
						active={state.dir === 'ltr'}
						disabled={controlsDisabled}
						onClick={(): void => run((c) => c.setTextDirection('ltr'))}
					>
						<DirectionGlyph dir="ltr" />
					</ToolbarButton>
					<ToolbarButton
						tooltip={t('label.rtl', 'Right to left')}
						active={state.dir === 'rtl'}
						disabled={controlsDisabled}
						onClick={(): void => run((c) => c.setTextDirection('rtl'))}
					>
						<DirectionGlyph dir="rtl" />
					</ToolbarButton>
				</Group>

				{/* Lists */}
				<Group mainAlignment="flex-start" padding={{ horizontal: 'extrasmall' }}>
					<SplitButton
						tooltip={t('label.bullet_list', 'Bullet list')}
						active={state.isBulletList}
						disabled={controlsDisabled}
						onPrimary={(): void => run((c) => c.toggleBulletList())}
						menuItems={bulletStyleItems}
					>
						<IconLabel icon="List" />
					</SplitButton>
					<SplitButton
						tooltip={t('label.ordered_list', 'Numbered list')}
						active={state.isOrderedList}
						disabled={controlsDisabled}
						onPrimary={(): void => run((c) => c.toggleOrderedList())}
						menuItems={orderedStyleItems}
					>
						<NumberedListGlyph />
					</SplitButton>
				</Group>

				{/* Insert */}
				<Group mainAlignment="flex-start" padding={{ horizontal: 'extrasmall' }}>
					<PopoverInputControl
						tooltip={t('label.link', 'Link')}
						icon="Link2Outline"
						active={state.isLink}
						disabled={controlsDisabled}
						inputLabel={t('label.link_address', 'Link address')}
						initialValue={state.currentHref}
						confirmLabel={t('label.apply', 'Apply')}
						onConfirm={(href): void => run((c) => c.extendMarkRange('link').setLink({ href }))}
						onRemove={(): void => run((c) => c.extendMarkRange('link').unsetLink())}
					/>
					<SplitButton
						tooltip={t('label.table', 'Table')}
						disabled={controlsDisabled}
						onPrimary={(): void =>
							run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))
						}
						menuItems={tableItems}
					>
						<IconLabel icon="GridOutline" />
					</SplitButton>
					<ToolbarButton
						tooltip={t('label.insert_image', 'Insert image')}
						disabled={controlsDisabled}
						onClick={pickImageFile}
					>
						<IconLabel icon="ImageOutline" />
					</ToolbarButton>
					<PopoverInputControl
						tooltip={t('label.insert_image_from_url', 'Insert image from URL')}
						icon="Image2"
						disabled={controlsDisabled}
						inputLabel={t('label.image_url', 'Image URL')}
						confirmLabel={t('label.insert', 'Insert')}
						onConfirm={(src): void => run((c) => c.setImage({ src }))}
					/>
					<CharmapControl
						disabled={controlsDisabled}
						onInsert={(char): void => run((c) => c.insertContent(char))}
					/>
					<DropdownButton
						tooltip={t('label.emoticons', 'Emoji')}
						label={<IconLabel icon="SmileOutline" />}
						items={emojiItems}
						disabled={controlsDisabled}
					/>
				</Group>

				{/* View */}
				<Group mainAlignment="flex-start" padding={{ left: 'extrasmall' }}>
					<ToolbarButton
						tooltip={t('label.visual_blocks', 'Show blocks')}
						active={visualBlocks}
						disabled={sourceView}
						onClick={onToggleVisualBlocks}
					>
						<VisualBlocksGlyph />
					</ToolbarButton>
					<ToolbarButton
						tooltip={t('label.source_code', 'Source code')}
						active={sourceView}
						disabled={disabled}
						onClick={onToggleSourceView}
					>
						<IconLabel icon="CodeOutline" />
					</ToolbarButton>
				</Group>

				<input
					ref={imageInputRef}
					type="file"
					accept="image/*"
					multiple
					style={{ display: 'none' }}
					data-testid="tiptap-image-input"
					onChange={onImageInputChange}
				/>
			</Bar>
		</Container>
	);
};
