/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import styled from '@emotion/styled';
import { Container } from '@zextras/carbonio-design-system';

/**
 * Curated set of commonly used special characters, grouped roughly by kind
 * (currency, punctuation, math, Latin letters with diacritics, Greek). Mirrors
 * the glyphs offered by the legacy TinyMCE `charmap` plugin so users keep the
 * same palette after the migration to Lexical.
 */
const SPECIAL_CHARACTERS: ReadonlyArray<string> = [
	// Currency & common symbols
	'€',
	'£',
	'¥',
	'¢',
	'$',
	'©',
	'®',
	'™',
	'§',
	'¶',
	'°',
	'#',
	// Punctuation & quotes
	'«',
	'»',
	'“',
	'”',
	'‘',
	'’',
	'„',
	'…',
	'–',
	'—',
	'•',
	'·',
	// Math & misc
	'±',
	'×',
	'÷',
	'≈',
	'≠',
	'≤',
	'≥',
	'∞',
	'√',
	'∑',
	'∆',
	'µ',
	'¼',
	'½',
	'¾',
	'⅓',
	'⅔',
	'π',
	'Ω',
	'∂',
	'α',
	'β',
	'γ',
	'δ',
	// Latin letters with diacritics
	'à',
	'á',
	'â',
	'ã',
	'ä',
	'å',
	'è',
	'é',
	'ê',
	'ë',
	'ì',
	'í',
	'î',
	'ï',
	'ò',
	'ó',
	'ô',
	'õ',
	'ö',
	'ù',
	'ú',
	'û',
	'ü',
	'ç',
	'ñ',
	'ß',
	'À',
	'É',
	'Ñ',
	'Ç',
	'Ä',
	'Ö',
	'Ü',
	'œ',
	'æ',
	'ø'
];

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(12, 1.5rem);
	gap: 0.125rem;
	max-height: 15rem;
	overflow-y: auto;
`;

const CharCell = styled.button`
	width: 1.5rem;
	height: 1.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	cursor: pointer;
	font-size: 1rem;
	border: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	border-radius: 0.125rem;
	background: ${({ theme }): string => theme.palette.gray6.regular};
	color: ${({ theme }): string => theme.palette.text.regular};

	&:hover {
		background: ${({ theme }): string => theme.palette.highlight.regular};
	}
`;

export type SpecialCharacterPickerProps = {
	onSelect: (character: string) => void;
};

/**
 * Grid palette of special characters. Clicking a cell commits the chosen glyph
 * through `onSelect`. Designed to live inside a CDS `Dropdown`, mirroring the
 * `TableGridPicker` / `EmojiPicker` popover pattern used by the toolbar.
 */
export const SpecialCharacterPicker = ({
	onSelect
}: SpecialCharacterPickerProps): React.JSX.Element => (
	<Container width="fit" height="fit" data-testid="special-character-picker">
		<Grid>
			{SPECIAL_CHARACTERS.map((character, index) => (
				<CharCell
					// eslint-disable-next-line react/no-array-index-key
					key={`${character}-${index}`}
					type="button"
					data-testid={`special-character-cell-${index}`}
					onClick={(): void => onSelect(character)}
				>
					{character}
				</CharCell>
			))}
		</Grid>
	</Container>
);
