/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Picker } from 'emoji-mart';

import { EmojiPicker } from '../emoji-picker';
import { setupTest, screen } from '@test-setup';

describe('EmojiPicker', () => {
	it('renders the emoji picker', () => {
		setupTest(<EmojiPicker onEmojiSelect={vi.fn()} />);

		expect(screen.getByTestId('emojiPicker')).toBeInTheDocument();
	});

	it('uses the em-emoji-picker class already registered by another module instead of its own', () => {
		// another module (e.g. Chats) bundling its own emoji-mart registered em-emoji-picker first
		const registeredPickerClass = vi.fn();
		const getSpy = vi
			.spyOn(customElements, 'get')
			.mockReturnValue(registeredPickerClass as unknown as CustomElementConstructor);

		setupTest(<EmojiPicker onEmojiSelect={vi.fn()} />);

		expect(getSpy).toHaveBeenCalledWith('em-emoji-picker');
		expect(registeredPickerClass).toHaveBeenCalledTimes(1);
		expect(registeredPickerClass).toHaveBeenCalledWith(
			expect.objectContaining({ previewPosition: 'none', skinTonePosition: 'none' })
		);
	});

	it('uses its own Picker class when em-emoji-picker is not registered yet', () => {
		vi.spyOn(customElements, 'get').mockReturnValue(undefined);

		setupTest(<EmojiPicker onEmojiSelect={vi.fn()} />);

		expect(screen.getByTestId('emojiPicker').querySelector('em-emoji-picker')).toBeInstanceOf(
			Picker
		);
	});
});
