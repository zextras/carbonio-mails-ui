/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest, screen } from '../../../../../carbonio-ui-commons/test/test-setup';
import { MAILS_VIEW_LAYOUTS } from '../../../../../constants';
import { TESTID_SELECTORS } from '../../../../../tests/constants';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../../tests/generators/store';
import { mockLayoutStorage } from '../../../../../tests/layouts-utils';
import PreviewPanelHeader from '../preview-panel-header';

describe('PreviewPanelHeader', () => {
	it('renders correctly', () => {
		const message = generateMessage();
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				searchRequestStatus: 'fulfilled',
				messages: {
					[message.id]: message
				}
			}
		});
		populateFoldersStore();

		setupTest(<PreviewPanelHeader item={message} folderId={FOLDERS.INBOX} />, { store });

		expect(screen.getByText(message.subject)).toBeVisible();
	});

	it('should not render navigation arrow if the current list layout is "split"', () => {
		mockLayoutStorage({ layout: MAILS_VIEW_LAYOUTS.SPLIT });

		const message = generateMessage();
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				searchRequestStatus: 'fulfilled',
				messages: {
					[message.id]: message
				}
			}
		});
		populateFoldersStore();

		setupTest(<PreviewPanelHeader item={message} folderId={FOLDERS.INBOX} />, { store });

		expect(
			screen.queryByRoleWithIcon('button', { icon: TESTID_SELECTORS.icons.navigatePrevious })
		).not.toBeInTheDocument();
		expect(
			screen.queryByRoleWithIcon('button', { icon: TESTID_SELECTORS.icons.navigateNext })
		).not.toBeInTheDocument();
	});

	it('should render navigation arrow if the current list layout is "no-split"', () => {
		mockLayoutStorage({ layout: MAILS_VIEW_LAYOUTS.NO_SPLIT });

		const message = generateMessage();
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				searchRequestStatus: 'fulfilled',
				messages: {
					[message.id]: message
				}
			}
		});
		populateFoldersStore();

		setupTest(<PreviewPanelHeader item={message} folderId={FOLDERS.INBOX} />, { store });

		expect(
			screen.getByRoleWithIcon('button', { icon: TESTID_SELECTORS.icons.navigatePrevious })
		).toBeVisible();
		expect(
			screen.getByRoleWithIcon('button', { icon: TESTID_SELECTORS.icons.navigateNext })
		).toBeVisible();
	});
});
