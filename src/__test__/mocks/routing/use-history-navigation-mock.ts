/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HistoryNavigation } from '@zextras/carbonio-ui-commons';
import * as historyNavigation from '@zextras/carbonio-ui-commons';

/**
 * Generates a mock for useHistoryNavigation hook and returns the result of the
 * hook, filled with mocked functions
 */
export const mockUseHistoryNavigation = (): HistoryNavigation => {
	const result = {
		replaceHistory: vi.fn(),
		pushHistory: vi.fn()
	} satisfies HistoryNavigation;
	vi.spyOn(historyNavigation, 'useHistoryNavigation').mockReturnValue(result);

	return result;
};
