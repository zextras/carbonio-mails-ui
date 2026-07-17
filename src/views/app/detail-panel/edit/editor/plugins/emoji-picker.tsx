/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useRef } from 'react';

import data from '@emoji-mart/data';
import { Container } from '@zextras/carbonio-design-system';
import { Picker } from 'emoji-mart';
import moment from 'moment';

/**
 * Shape of the object emitted by `emoji-mart`'s `onEmojiSelect`. Only `native`
 * (the glyph itself) is consumed here; the remaining fields mirror the type
 * used by `carbonio-ws-collaboration-ui` for cross-module consistency.
 */
export type Emoji = {
	emoticons: string[];
	id: string;
	keywords: string[];
	name: string;
	native: string;
	shortcodes: string;
	unified: string;
};

type EmojiPickerProps = {
	onEmojiSelect: (emoji: Emoji) => void;
};

/**
 * Wraps `emoji-mart`'s imperative `Picker` (the same library used by
 * `carbonio-ws-collaboration-ui`). The picker is instantiated into a container
 * ref on mount and torn down on unmount. Open/close is managed by the hosting
 * CDS `Dropdown`, so no hover logic is needed here.
 */
export const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps): React.JSX.Element => {
	const pickerContainerRef = useRef<HTMLDivElement>(null);
	const pickerRef = useRef<Picker | null>(null);

	useEffect(() => {
		pickerRef.current = new Picker({
			data,
			onEmojiSelect,
			ref: pickerContainerRef,
			locale: moment.locale(),
			previewPosition: 'none',
			skinTonePosition: 'none'
		});
		return (): void => {
			pickerRef.current = null;
		};
	}, [onEmojiSelect]);

	return (
		<Container ref={pickerContainerRef} width="22rem" height="fit" data-testid="emojiPicker" />
	);
};
