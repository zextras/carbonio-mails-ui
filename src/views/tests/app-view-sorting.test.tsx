/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { waitFor, within } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { capitalize } from 'lodash';

import { mockLayoutStorage } from '../../__test__/layouts-utils';
import { setupViewByConversation } from '../../__test__/setup-utils';
import { MAILS_VIEW_LAYOUTS, MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS } from '../../constants';
import { SORTING_OPTIONS } from '../../constants';
import AppView from '../app-view';
import { screen, setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';

const waitForLazySpinnerToDisappear = (): Promise<void> =>
	waitFor(
		() => {
			expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
		},
		{ timeout: 10000 }
	);

describe('AppView sorting functionality', () => {
	beforeEach(() => {
		mockLayoutStorage({
			layout: MAILS_VIEW_LAYOUTS.SPLIT,
			splitOrientation: MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL
		});
		populateFoldersStore();
		setupViewByConversation();
	});

	const inboxFolderId = `${FOLDERS.INBOX}`;
	const trashFolderId = `${FOLDERS.TRASH}`;
	const sentFolderId = `${FOLDERS.SENT}`;

	describe('Sorting in Trash folder', () => {
		it('should show changeDate option in trash folder sorting dropdown', async () => {
			const { user } = setupTest(<AppView />, {
				initialEntries: [`/folder/${trashFolderId}`]
			});
			await waitForLazySpinnerToDisappear();

			await screen.findByTestId('sorting-dropdown');

			const sortIcon = screen.getByRoleWithIcon('button', { icon: /icon: AzListOutline/i });
			await user.click(sortIcon);

			const dropdownList = await screen.findByTestId(/dropdown-popper-list/i);
			expect(dropdownList).toBeInTheDocument();

			const changeDateLabel = capitalize(SORTING_OPTIONS.changeDate.label);
			expect(within(dropdownList).getByText(new RegExp(changeDateLabel, 'i'))).toBeInTheDocument();
		});

		it('should have changeDate as default sort in trash folder', async () => {
			const { user } = setupTest(<AppView />, {
				initialEntries: [`/folder/${trashFolderId}`]
			});
			await waitForLazySpinnerToDisappear();

			const sortIcon = screen.getByRoleWithIcon('button', { icon: /icon: AzListOutline/i });
			await user.click(sortIcon);

			const dropdownList = await screen.findByTestId(/dropdown-popper-list/i);

			const changeDateLabel = capitalize(SORTING_OPTIONS.changeDate.label);
			expect(within(dropdownList).getByText(`${changeDateLabel} (Default)`)).toBeInTheDocument();
		});

		it('should not show changeDate option when not in trash folder (Inbox)', async () => {
			const { user } = setupTest(<AppView />, {
				initialEntries: [`/folder/${inboxFolderId}`]
			});
			await waitForLazySpinnerToDisappear();

			const sortIcon = screen.getByRoleWithIcon('button', { icon: /icon: AzListOutline/i });
			await user.click(sortIcon);

			const dropdownList = await screen.findByTestId(/dropdown-popper-list/i);

			const changeDateLabel = capitalize(SORTING_OPTIONS.changeDate.label);
			expect(within(dropdownList).queryByText(changeDateLabel)).not.toBeInTheDocument();
			expect(
				within(dropdownList).queryByText(`${changeDateLabel} (Default)`)
			).not.toBeInTheDocument();
		});

		it('should not show changeDate option when not in trash folder (Sent)', async () => {
			const { user } = setupTest(<AppView />, {
				initialEntries: [`/folder/${sentFolderId}`]
			});
			await waitForLazySpinnerToDisappear();

			const sortIcon = screen.getByRoleWithIcon('button', { icon: /icon: AzListOutline/i });
			await user.click(sortIcon);

			const dropdownList = await screen.findByTestId(/dropdown-popper-list/i);

			const changeDateLabel = capitalize(SORTING_OPTIONS.changeDate.label);
			expect(within(dropdownList).queryByText(changeDateLabel)).not.toBeInTheDocument();
			expect(
				within(dropdownList).queryByText(`${changeDateLabel} (Default)`)
			).not.toBeInTheDocument();
		});

		it('should have date as default sort in non-trash folders', async () => {
			const { user } = setupTest(<AppView />, {
				initialEntries: [`/folder/${inboxFolderId}`]
			});
			await waitForLazySpinnerToDisappear();

			const sortIcon = screen.getByRoleWithIcon('button', { icon: /icon: AzListOutline/i });
			await user.click(sortIcon);

			const dropdownList = await screen.findByTestId(/dropdown-popper-list/i);

			const dateLabel = capitalize(SORTING_OPTIONS.date.label);
			expect(within(dropdownList).getByText(`${dateLabel} (Default)`)).toBeInTheDocument();
		});
	});

	describe('Sorting options availability', () => {
		it('should include all standard sorting options in inbox folder', async () => {
			const { user } = setupTest(<AppView />, {
				initialEntries: [`/folder/${inboxFolderId}`]
			});
			await waitForLazySpinnerToDisappear();

			const sortIcon = screen.getByRoleWithIcon('button', { icon: /icon: AzListOutline/i });
			await user.click(sortIcon);

			const dropdownList = await screen.findByTestId(/dropdown-popper-list/i);

			expect(
				within(dropdownList).getByText(`${capitalize(SORTING_OPTIONS.date.label)} (Default)`)
			).toBeInTheDocument();
			expect(
				within(dropdownList).getByText(capitalize(SORTING_OPTIONS.subject.label))
			).toBeInTheDocument();
			expect(
				within(dropdownList).getByText(capitalize(SORTING_OPTIONS.from.label))
			).toBeInTheDocument();
			expect(
				within(dropdownList).getByText(capitalize(SORTING_OPTIONS.size.label))
			).toBeInTheDocument();

			// Check that TO option is not present in inbox
			expect(
				within(dropdownList).queryByText(capitalize(SORTING_OPTIONS.to.label))
			).not.toBeInTheDocument();
		});

		it('should show TO option instead of FROM in sent folder', async () => {
			const { user } = setupTest(<AppView />, {
				initialEntries: [`/folder/${sentFolderId}`]
			});
			await waitForLazySpinnerToDisappear();

			const sortIcon = screen.getByRoleWithIcon('button', { icon: /icon: AzListOutline/i });
			await user.click(sortIcon);

			const dropdownList = await screen.findByTestId(/dropdown-popper-list/i);

			// Check that TO option is present
			expect(
				within(dropdownList).getByText(capitalize(SORTING_OPTIONS.to.label))
			).toBeInTheDocument();

			// Check that FROM option is not present in sent folder
			expect(
				within(dropdownList).queryByText(capitalize(SORTING_OPTIONS.from.label))
			).not.toBeInTheDocument();
		});

		it('should include all sorting options plus changeDate in trash folder', async () => {
			const { user } = setupTest(<AppView />, {
				initialEntries: [`/folder/${trashFolderId}`]
			});
			await waitForLazySpinnerToDisappear();

			const sortIcon = screen.getByRoleWithIcon('button', { icon: /icon: AzListOutline/i });
			await user.click(sortIcon);

			const dropdownList = await screen.findByTestId(/dropdown-popper-list/i);

			// Check all options including changeDate are present
			expect(
				within(dropdownList).getByText(capitalize(SORTING_OPTIONS.date.label))
			).toBeInTheDocument();
			expect(
				within(dropdownList).getByText(`${capitalize(SORTING_OPTIONS.changeDate.label)} (Default)`)
			).toBeInTheDocument();
			expect(
				within(dropdownList).getByText(capitalize(SORTING_OPTIONS.subject.label))
			).toBeInTheDocument();
			expect(
				within(dropdownList).getByText(capitalize(SORTING_OPTIONS.from.label))
			).toBeInTheDocument();
			expect(
				within(dropdownList).getByText(capitalize(SORTING_OPTIONS.size.label))
			).toBeInTheDocument();
		});
	});
});
