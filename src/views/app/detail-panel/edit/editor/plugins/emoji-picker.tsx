/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useRef } from 'react';

import data from '@emoji-mart/data';
import styled from '@emotion/styled';
import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { Picker } from 'emoji-mart';
import moment from 'moment';

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

const PickerContainer = styled(Container)`
	& > em-emoji-picker {
		--border-radius: 0.25rem;
	}
`;

export const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps): React.JSX.Element => {
	const pickerContainerRef = useRef<HTMLDivElement>(null);
	const pickerRef = useRef<Picker | null>(null);

	const {
		prefs: { carbonioPrefDarkMode }
	} = useUserSettings();

	const darkModeEnabled =
		carbonioPrefDarkMode === 'enabled' ||
		(carbonioPrefDarkMode === 'auto' &&
			!!window.matchMedia?.('(prefers-color-scheme: dark)').matches);

	useEffect(() => {
		pickerRef.current = new Picker({
			data,
			onEmojiSelect,
			ref: pickerContainerRef,
			locale: moment.locale(),
			previewPosition: 'none',
			skinTonePosition: 'none',
			theme: darkModeEnabled ? 'dark' : 'light'
		});
		return (): void => {
			pickerRef.current = null;
		};
	}, [onEmojiSelect, darkModeEnabled]);

	return (
		<PickerContainer
			ref={pickerContainerRef}
			width="22rem"
			height="fit"
			data-testid="emojiPicker"
		/>
	);
};
