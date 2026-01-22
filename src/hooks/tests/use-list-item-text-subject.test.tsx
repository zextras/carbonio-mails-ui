/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { renderHook } from '@testing-library/react';

import { useListItemTextSubject } from '../use-list-item-text-subject';

describe('useListItemTextSubject', () => {
	it('will return "<No Subject>" if subject is empty', () => {
		const { result } = renderHook(() => useListItemTextSubject(''));
		expect(result.current).toBe('<No Subject>');
	});
	it('will return the subject if subject is available', () => {
		const { result } = renderHook(() => useListItemTextSubject('subject'));
		expect(result.current).toBe('subject');
	});
});
