/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { previewContextMock } from '../../__test__/mocks/carbonio-ui-preview';
import { setupHook } from '../../__test__/test-setup';
import { useIsFilePreviewOpen } from '../use-is-file-preview-open';

const mockPreviewCurrentIndex = (index: number): void => {
	previewContextMock.currentIndex = index;
};

describe('useIsFilePreviewOpen', () => {
	it('returns true when there is a preview open >= 0', () => {
		mockPreviewCurrentIndex(0);

		const { result } = setupHook(useIsFilePreviewOpen);

		expect(result.current).toBe(true);
	});

	it('returns false when there is no preview open < 0', () => {
		mockPreviewCurrentIndex(-1);

		const { result } = setupHook(useIsFilePreviewOpen);

		expect(result.current).toBe(false);
	});
});
