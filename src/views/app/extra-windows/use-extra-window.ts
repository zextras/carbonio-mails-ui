/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useContext } from 'react';
import type { ExtraWindowsCreationResult } from '../../../types';
import { ExtraWindowContext } from './extra-window';
import { useExtraWindowsManager } from './extra-window-manager';

/**
 * Tells if the calling component is inside an ExtraWindow and
 * returns the relative window creation data.
 */
export const useExtraWindow = (): {
	isInsideExtraWindow: boolean;
	windowData?: ExtraWindowsCreationResult;
} => {
	const { getWindow } = useExtraWindowsManager();

	const windowContext = useContext(ExtraWindowContext);
	if (!windowContext) {
		return { isInsideExtraWindow: false };
	}

	return {
		windowData: getWindow && getWindow({ windowId: windowContext.windowId }),
		isInsideExtraWindow: true
	};
};
