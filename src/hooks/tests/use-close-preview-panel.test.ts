/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { FOLDERS } from '@zextras/carbonio-ui-commons';
import type { Mock } from 'vitest';

import { setupHook } from '@test-setup';
import { MAILS_ROUTE, SEARCH_ROUTE } from 'constants/index';
import { useClosePreviewPanel } from 'hooks/use-close-preview-panel';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useNavigate: (): Mock => mockNavigate
}));

describe('useClosePreviewPanel', () => {
	beforeEach(() => {
		mockNavigate.mockClear();
	});

	it('should navigate to the folder when not in the search module', () => {
		const { result } = setupHook(useClosePreviewPanel, {
			initialEntries: [`/${MAILS_ROUTE}/folder/${FOLDERS.INBOX}/message/1`],
			initialProps: [FOLDERS.INBOX]
		});

		act(() => {
			result.current();
		});

		expect(mockNavigate).toHaveBeenCalledWith(`/${MAILS_ROUTE}/folder/${FOLDERS.INBOX}`, {
			replace: true
		});
	});

	it('should navigate to the search results when in the search module', () => {
		const { result } = setupHook(useClosePreviewPanel, {
			initialEntries: [`/${SEARCH_ROUTE}/message/1`],
			initialProps: [FOLDERS.INBOX]
		});

		act(() => {
			result.current();
		});

		expect(mockNavigate).toHaveBeenCalledWith(`/${SEARCH_ROUTE}`, { replace: true });
	});
});
