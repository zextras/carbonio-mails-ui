/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react';

import { type DropdownItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { $getSelection, $isRangeSelection, type LexicalEditor } from 'lexical';

import { EmojiPicker, type Emoji } from '../emoji-picker';
import { SpecialCharacterPicker } from '../special-character-picker';

type EmojiAndSpecialCharacters = {
	insertEmoji: (emoji: Emoji) => void;
	insertSpecialCharacter: (character: string) => void;
	emojiItems: Array<DropdownItem>;
	specialCharItems: Array<DropdownItem>;
	emojiLabel: string;
	specialCharLabel: string;
	emojiMenuOpen: boolean;
	setEmojiMenuOpen: Dispatch<SetStateAction<boolean>>;
	specialCharMenuOpen: boolean;
	setSpecialCharMenuOpen: Dispatch<SetStateAction<boolean>>;
};

export function useEmojiAndSpecialCharacters(editor: LexicalEditor): EmojiAndSpecialCharacters {
	const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);
	const [specialCharMenuOpen, setSpecialCharMenuOpen] = useState(false);

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

	const emojiLabel = t('lexical-label.emoji', 'Emoji');

	const specialCharLabel = t('lexical-label.special_character', 'Special character');

	const emojiItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'emoji-picker',
				label: emojiLabel,
				keepOpen: true,
				style: { padding: 0 },
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

	return {
		insertEmoji,
		insertSpecialCharacter,
		emojiItems,
		specialCharItems,
		emojiLabel,
		specialCharLabel,
		emojiMenuOpen,
		setEmojiMenuOpen,
		specialCharMenuOpen,
		setSpecialCharMenuOpen
	};
}
