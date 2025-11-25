/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { waitFor } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import type { Mock } from 'vitest';

import { screen, setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { TESTID_SELECTORS } from '__test__/constants';
import { generateConversation } from '__test__/generators/generateConversation';
import { mockLayoutStorage } from '__test__/layouts-utils';
import { MAILS_VIEW_LAYOUTS } from 'constants/index';
import { setConversationsInEmailStore } from 'store/emails/store';
import { PreviewPanelHeader } from 'views/app/detail-panel/preview/preview-panel-header';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
	const actual = await vi.importActual('react-router-dom');
	return {
		...actual,
		useNavigate: (): Mock => mockNavigate
	};
});

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

	it('should render navigation arrow if the current list layout is "no-split"', async () => {
		mockLayoutStorage({ layout: MAILS_VIEW_LAYOUTS.NO_SPLIT });
		populateFoldersStore();
		const conversation = generateConversation({ id: '1' });
		createSoapAPIInterceptor('Search');
		setConversationsInEmailStore([conversation], false);

		setupTest(
			<PreviewPanelHeader itemType={'conversation'} isRead={false} folderId={FOLDERS.INBOX} />,
			{
				initialEntries: [`/mails/folder/2/conversation/1`],
				path: '/mails/folder/:folderId/conversation/:conversationId'
			}
		);
		await waitFor(async () => {
			expect(
				screen.getByRoleWithIcon('button', { icon: TESTID_SELECTORS.icons.navigatePrevious })
			).toBeVisible();
		});
		await waitFor(async () => {
			expect(
				screen.getByRoleWithIcon('button', { icon: TESTID_SELECTORS.icons.navigateNext })
			).toBeVisible();
		});
	});
});
