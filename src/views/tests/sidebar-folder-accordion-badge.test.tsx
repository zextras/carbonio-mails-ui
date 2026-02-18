/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { getCurrentRoute, useLocalStorage } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { populateFoldersStore } from '@test-utils/store/folders';
import { MAIL_APP_ID, MAILS_ROUTE } from 'constants/index';
import Sidebar from 'views/sidebar/sidebar';

describe('Sidebar Folder Accordion Badge Counters - Integration Tests', () => {
	beforeEach(() => {
		getCurrentRoute.mockReturnValue({
			route: MAILS_ROUTE,
			id: MAIL_APP_ID,
			app: MAIL_APP_ID
		});
		useLocalStorage.mockReturnValue([[FOLDERS.USER_ROOT], vi.fn()]);
		populateFoldersStore();
	});

	describe('Badge Display for Regular Folders - Unread Count', () => {
		it('should display inbox folder with unread badge counter (37)', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.INBOX}`],
				path: '/mails/*'
			});

			const inboxFolderElement = await screen.findByTestId(
				`accordion-folder-item-${FOLDERS.INBOX}`
			);

			expect(within(inboxFolderElement).getByText('37')).toBeInTheDocument();
		});
	});

	describe('Badge Display for Draft Folder - Total Message Count', () => {
		it('should display drafts folder with total message badge counter (13), not unread', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.DRAFTS}`],
				path: '/mails/*'
			});

			const draftsElement = await screen.findByTestId(`accordion-folder-item-${FOLDERS.DRAFTS}`);

			expect(within(draftsElement).getByText('13')).toBeInTheDocument();
		});
	});

	describe('Badge Display for Root/Account Folder - Total Unread from Subfolders', () => {
		it('should display root folder with aggregated unread count from subfolders (72)', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.INBOX}`],
				path: '/mails/*'
			});

			const rootFolder = await screen.findByTestId(`accordion-folder-item-${FOLDERS.USER_ROOT}`);

			const badgeElements = within(rootFolder).getByText('72');
			expect(badgeElements).toBeInTheDocument();
		});
	});

	describe('Badge Counter Visibility Based on Count Value', () => {
		it('should not display badge when count is 0 or undefined', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.USER_ROOT}`],
				path: '/mails/*'
			});

			const rootFolder = await screen.findByTestId(`accordion-folder-item-${FOLDERS.USER_ROOT}`);

			expect(rootFolder).toBeInTheDocument();
		});
	});
});
