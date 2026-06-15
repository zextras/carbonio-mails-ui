/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import styled from '@emotion/styled';

/*
 * The Carbonio Design System icon set (Eva icons) has no glyphs for several
 * rich-text actions (bold/italic/underline/strikethrough, paragraph alignment,
 * indentation, text direction, visual blocks). Those are rendered here as
 * lightweight typographic / CSS-drawn glyphs so the toolbar visually matches the
 * legacy TinyMCE toolbar while still using CDS icons everywhere a CDS icon
 * exists (see `tiptap-toolbar.tsx`).
 */

const GLYPH_SIZE = '1.25rem';

const Letter = styled.span`
	font-size: 1rem;
	line-height: 1;
	font-family: Georgia, 'Times New Roman', serif;
`;

export const BoldGlyph = (): React.JSX.Element => <Letter style={{ fontWeight: 700 }}>B</Letter>;
export const ItalicGlyph = (): React.JSX.Element => (
	<Letter style={{ fontStyle: 'italic' }}>I</Letter>
);
export const UnderlineGlyph = (): React.JSX.Element => (
	<Letter style={{ textDecoration: 'underline' }}>U</Letter>
);
export const StrikethroughGlyph = (): React.JSX.Element => (
	<Letter style={{ textDecoration: 'line-through' }}>S</Letter>
);

const ClearWrapper = styled.span`
	position: relative;
	font-size: 1rem;
	line-height: 1;
	font-family: Georgia, 'Times New Roman', serif;
	font-style: italic;
`;
const ClearCross = styled.span`
	position: absolute;
	right: -0.4rem;
	bottom: -0.1rem;
	font-size: 0.6rem;
	font-style: normal;
	font-family: sans-serif;
`;
export const ClearFormatGlyph = (): React.JSX.Element => (
	<ClearWrapper>
		T<ClearCross>✕</ClearCross>
	</ClearWrapper>
);

const ForeColorWrapper = styled.span<{ $color: string }>`
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	font-size: 1rem;
	line-height: 1;
	font-family: Georgia, 'Times New Roman', serif;
	font-weight: 700;
	&::after {
		content: '';
		display: block;
		width: 0.85rem;
		height: 0.18rem;
		margin-top: 0.05rem;
		background-color: ${({ $color }): string => $color};
	}
`;
export const ForeColorGlyph = ({ color }: { color: string }): React.JSX.Element => (
	<ForeColorWrapper $color={color}>A</ForeColorWrapper>
);

const OmegaGlyph = styled.span`
	font-size: 1.05rem;
	line-height: 1;
`;
export const CharmapGlyph = (): React.JSX.Element => <OmegaGlyph>Ω</OmegaGlyph>;

const NumberedWrapper = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.15rem;
	font-size: 0.7rem;
	line-height: 1;
`;
const NumberedLines = styled.span`
	display: inline-flex;
	flex-direction: column;
	gap: 0.18rem;
	> span {
		display: block;
		width: 0.55rem;
		height: 0.12rem;
		background-color: currentColor;
	}
`;
export const NumberedListGlyph = (): React.JSX.Element => (
	<NumberedWrapper>
		<span style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
			<span>1</span>
			<span>2</span>
			<span>3</span>
		</span>
		<NumberedLines>
			<span />
			<span />
			<span />
		</NumberedLines>
	</NumberedWrapper>
);

const AlignBox = styled.span`
	display: inline-flex;
	flex-direction: column;
	justify-content: center;
	gap: 0.16rem;
	width: ${GLYPH_SIZE};
	height: ${GLYPH_SIZE};
`;
const Bar = styled.span<{ $width: string; $align: string }>`
	height: 0.12rem;
	width: ${({ $width }): string => $width};
	background-color: currentColor;
	align-self: ${({ $align }): string => $align};
`;

type AlignVariant = 'left' | 'center' | 'right' | 'justify';
const ALIGN_SELF: Record<AlignVariant, string> = {
	left: 'flex-start',
	center: 'center',
	right: 'flex-end',
	justify: 'stretch'
};
export const AlignGlyph = ({ variant }: { variant: AlignVariant }): React.JSX.Element => {
	const self = ALIGN_SELF[variant];
	const short = variant === 'justify' ? '100%' : '60%';
	return (
		<AlignBox>
			<Bar $width="100%" $align={self} />
			<Bar $width={short} $align={self} />
			<Bar $width="100%" $align={self} />
			<Bar $width={short} $align={self} />
		</AlignBox>
	);
};

const IndentBox = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.1rem;
	width: ${GLYPH_SIZE};
	height: ${GLYPH_SIZE};
	font-size: 0.7rem;
`;
const IndentLines = styled.span`
	display: inline-flex;
	flex-direction: column;
	gap: 0.14rem;
	flex: 1;
	> span {
		height: 0.12rem;
		background-color: currentColor;
	}
`;
export const IndentGlyph = ({
	direction
}: {
	direction: 'indent' | 'outdent';
}): React.JSX.Element => (
	<IndentBox>
		{direction === 'outdent' && <span>◂</span>}
		<IndentLines>
			<span />
			<span style={{ width: '70%' }} />
			<span />
		</IndentLines>
		{direction === 'indent' && <span>▸</span>}
	</IndentBox>
);

const DirectionWrapper = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.05rem;
	font-size: 0.95rem;
	line-height: 1;
`;
export const DirectionGlyph = ({ dir }: { dir: 'ltr' | 'rtl' }): React.JSX.Element => (
	<DirectionWrapper>
		{dir === 'rtl' && <span style={{ fontSize: '0.7rem' }}>◂</span>}
		<span>¶</span>
		{dir === 'ltr' && <span style={{ fontSize: '0.7rem' }}>▸</span>}
	</DirectionWrapper>
);

const VisualBlocksBox = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.1rem;
	height: 1.1rem;
	border: 0.0625rem dashed currentColor;
	font-size: 0.8rem;
	line-height: 1;
`;
export const VisualBlocksGlyph = (): React.JSX.Element => <VisualBlocksBox>¶</VisualBlocksBox>;
