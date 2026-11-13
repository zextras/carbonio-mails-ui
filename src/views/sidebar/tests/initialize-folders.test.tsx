/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';
import { FOLDER_VIEW, useInitializeFolders } from '@zextras/carbonio-ui-commons';

import { MailboxRefreshedEvent } from '../../../event-bus/events/mailbox-refreshed';
import { InitializeFolders } from '../initialize-folders';
import { setupTest } from '@test-setup';

vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	useInitializeFolders: vi.fn()
}));

describe('InitializeFolders', () => {
	it('should initialize the folders of the message view', () => {
		setupTest(<InitializeFolders />);

		expect(useInitializeFolders).toHaveBeenCalledWith(FOLDER_VIEW.message);
	});

	it('should initialize the folders again when the mailbox is refreshed', () => {
		setupTest(<InitializeFolders />);
		const mounts = vi.mocked(useInitializeFolders).mock.calls.length;

		act(() => {
			window.dispatchEvent(new MailboxRefreshedEvent());
		});

		expect(vi.mocked(useInitializeFolders).mock.calls.length).toBeGreaterThan(mounts);
	});
});
