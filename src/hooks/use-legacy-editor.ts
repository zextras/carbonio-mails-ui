/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useLocalStorage } from '@zextras/carbonio-shell-ui';

import { LOCAL_STORAGE_LEGACY_EDITOR } from 'constants/index';

export type UseLegacyEditorResult = {
	readonly useLegacyEditor: boolean;
	readonly setUseLegacyEditor: (value: boolean) => void;
	readonly toggleLegacyEditor: () => void;
};

export const useLegacyEditor = (): UseLegacyEditorResult => {
	const [isLegacyEditorEnabled, setUseLegacyEditor] = useLocalStorage<boolean>(
		LOCAL_STORAGE_LEGACY_EDITOR,
		false
	);

	return useMemo(
		() => ({
			useLegacyEditor: isLegacyEditorEnabled,
			setUseLegacyEditor,
			toggleLegacyEditor: () => setUseLegacyEditor((prev) => !prev)
		}),
		[isLegacyEditorEnabled, setUseLegacyEditor]
	);
};
