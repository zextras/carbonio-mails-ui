/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HistoryNavigation } from '../../../helpers/use-history-navigation';
import * as historyNavigation from '../../../helpers/use-history-navigation';

/**
 * Generates a mock for useHistoryNavigation hook and returns the result of the
 * hook, filled with mocked functions
 */
export const mockUseHistoryNavigation = (): HistoryNavigation => {
	const result = {
		replaceHistory: jest.fn(),
		pushHistory: jest.fn()
	} satisfies HistoryNavigation;
	jest.spyOn(historyNavigation, 'useHistoryNavigation').mockReturnValue(result);

	return result;
};
