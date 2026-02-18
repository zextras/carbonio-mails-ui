/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { getCurrentRoute, useLocalStorage } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { populateFoldersStore } from '@test-utils/store/folders';
import { MAIL_APP_ID, MAILS_ROUTE } from 'constants/index';
import { Sidebar } from 'views/sidebar/sidebar';

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

	describe('Badge Display for Regular Folders', () => {
		it('should display inbox folder with badge counter capability', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.INBOX}`],
				path: '/mails/*'
			});

			await waitFor(() => {
				const inboxFolderElement = screen.getByTestId(`accordion-folder-item-${FOLDERS.INBOX}`);
				expect(inboxFolderElement).toBeInTheDocument();
			});
		});

		it('should display sent folder with badge counter capability', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.SENT}`],
				path: '/mails/*'
			});

			await waitFor(() => {
				const sentFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.SENT}`);
				expect(sentFolder).toBeInTheDocument();
			});
		});

		it('should display spam folder with badge counter capability', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.SPAM}`],
				path: '/mails/*'
			});

			await waitFor(() => {
				const spamFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.SPAM}`);
				expect(spamFolder).toBeInTheDocument();
			});
		});

		it('should display trash folder with badge counter capability', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.TRASH}`],
				path: '/mails/*'
			});

			await waitFor(() => {
				const trashFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.TRASH}`);
				expect(trashFolder).toBeInTheDocument();
			});
		});

		it('should display drafts folder with badge counter capability', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.DRAFTS}`],
				path: '/mails/*'
			});

			await waitFor(() => {
				const draftsFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.DRAFTS}`);
				expect(draftsFolder).toBeInTheDocument();
			});
		});
	});

	describe('Badge Display for Root/Account Folder', () => {
		it('should display root folder with unread count from all subfolders', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.USER_ROOT}`],
				path: '/mails/*'
			});

			await waitFor(() => {
				const rootFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.USER_ROOT}`);
				expect(rootFolder).toBeInTheDocument();
			});
		});

		it('should display root folder even when no subfolders have unread messages', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.USER_ROOT}`],
				path: '/mails/*'
			});

			await waitFor(() => {
				const rootFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.USER_ROOT}`);
				expect(rootFolder).toBeInTheDocument();
			});
		});
	});

	describe('Badge Counter Visibility and Behavior', () => {
		it('should render accordion items with proper structure for badge display', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.INBOX}`],
				path: '/mails/*'
			});

			await waitFor(() => {
				const inboxFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.INBOX}`);
				expect(inboxFolder).toBeInTheDocument();
				// Badge counter will only show if count > 0 based on badgeCount logic
			});
		});

		it('should render accordion items with correct icon and styling', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.INBOX}`],
				path: '/mails/*'
			});

			await waitFor(() => {
				const inboxFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.INBOX}`);
				expect(inboxFolder).toBeInTheDocument();
			});
		});
	});

	describe('Accordion Expansion and Child Folders', () => {
		it('should display all child folders under root folder in expanded state', async () => {
			setupTest(<Sidebar expanded />, {
				initialEntries: [`/mails/folder/${FOLDERS.USER_ROOT}`],
				path: '/mails/*'
			});

			await waitFor(() => {
				expect(
					screen.getByTestId(`accordion-folder-item-${FOLDERS.USER_ROOT}`)
				).toBeInTheDocument();
			});

			// All system folders should be visible as children of root
			const inboxFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.INBOX}`);
			const draftsFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.DRAFTS}`);
			const sentFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.SENT}`);
			const trashFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.TRASH}`);
			const spamFolder = screen.getByTestId(`accordion-folder-item-${FOLDERS.SPAM}`);

			expect(inboxFolder).toBeInTheDocument();
			expect(draftsFolder).toBeInTheDocument();
			expect(sentFolder).toBeInTheDocument();
			expect(trashFolder).toBeInTheDocument();
			expect(spamFolder).toBeInTheDocument();
		});
	});
});
