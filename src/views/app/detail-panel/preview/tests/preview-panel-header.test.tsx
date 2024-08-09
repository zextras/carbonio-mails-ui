/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest, screen } from '../../../../../carbonio-ui-commons/test/test-setup';
import { MAILS_VIEW_LAYOUTS } from '../../../../../constants';
import { TESTID_SELECTORS } from '../../../../../tests/constants';
import { generateStore } from '../../../../../tests/generators/store';
import { mockLayoutStorage } from '../../../../../tests/layouts-utils';
import PreviewPanelHeader from '../preview-panel-header';

describe('PreviewPanelHeader', () => {
	it('renders correctly', () => {
		populateFoldersStore();
		const subject = faker.word.words();

		setupTest(
			<PreviewPanelHeader
				itemType={'conversation'}
				subject={subject}
				isRead={false}
				folderId={FOLDERS.INBOX}
			/>
		);

		expect(screen.getByText(subject)).toBeVisible();
	});

	it('should render the subject placeholder', () => {
		populateFoldersStore();

		setupTest(
			<PreviewPanelHeader itemType={'conversation'} isRead={false} folderId={FOLDERS.INBOX} />
		);

		expect(screen.getByText('<No Subject>')).toBeVisible();
	});

	it('should not render navigation arrow if the current list layout is "split"', () => {
		mockLayoutStorage({ layout: MAILS_VIEW_LAYOUTS.SPLIT });
		populateFoldersStore();

		setupTest(
			<PreviewPanelHeader itemType={'conversation'} isRead={false} folderId={FOLDERS.INBOX} />
		);

		expect(
			screen.queryByRoleWithIcon('button', { icon: TESTID_SELECTORS.icons.navigatePrevious })
		).not.toBeInTheDocument();
		expect(
			screen.queryByRoleWithIcon('button', { icon: TESTID_SELECTORS.icons.navigateNext })
		).not.toBeInTheDocument();
	});

	it('should render navigation arrow if the current list layout is "no-split"', () => {
		mockLayoutStorage({ layout: MAILS_VIEW_LAYOUTS.NO_SPLIT });
		populateFoldersStore();

		const store = generateStore();

		setupTest(
			<PreviewPanelHeader itemType={'conversation'} isRead={false} folderId={FOLDERS.INBOX} />,
			{
				initialEntries: [`/mails/folder/2/conversation/1`],
				path: '/mails/folder/:folderId/conversation/:conversationId',
				store
			}
		);
		expect(
			screen.getByRoleWithIcon('button', { icon: TESTID_SELECTORS.icons.navigatePrevious })
		).toBeVisible();
		expect(
			screen.getByRoleWithIcon('button', { icon: TESTID_SELECTORS.icons.navigateNext })
		).toBeVisible();
	});
});
