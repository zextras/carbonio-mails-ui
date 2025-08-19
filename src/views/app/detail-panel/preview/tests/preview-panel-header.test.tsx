/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { waitFor } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { screen, setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { MAILS_VIEW_LAYOUTS } from 'constants/index';
import { setConversationsInEmailStore } from 'store/emails/store';
import { TESTID_SELECTORS } from 'tests/constants';
import { generateConversation } from 'tests/generators/generateConversation';
import { mockLayoutStorage } from 'tests/layouts-utils';
import { PreviewPanelHeader } from 'views/app/detail-panel/preview/preview-panel-header';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
	const actual = jest.requireActual('react-router-dom');
	return {
		...actual,
		useNavigate: (): jest.Mock => mockNavigate
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

	it('registers keydown listener on mount and removes it on unmount', () => {
		populateFoldersStore();

		const addSpy = jest.spyOn(window, 'addEventListener');
		const removeSpy = jest.spyOn(window, 'removeEventListener');

		const { unmount } = setupTest(
			<PreviewPanelHeader itemType="conversation" isRead={false} folderId={FOLDERS.INBOX} />
		);

		// registration verify
		const addCall = addSpy.mock.calls.find(([type]) => type === 'keydown');
		expect(addCall).toBeTruthy();
		const handler = addCall?.[1] as EventListener;
		expect(typeof handler).toBe('function');

		// cleanup
		unmount();

		// removal verify
		const removeCall = removeSpy.mock.calls.find(
			([type, h]) => type === 'keydown' && h === handler
		);
		expect(removeCall).toBeTruthy();

		addSpy.mockRestore();
		removeSpy.mockRestore();
	});

	it('on Escape prevents default, stops propagation and triggers replace navigation', () => {
		populateFoldersStore();
		mockNavigate.mockClear();

		const addSpy = jest.spyOn(window, 'addEventListener');

		setupTest(
			<PreviewPanelHeader itemType="conversation" isRead={false} folderId={FOLDERS.INBOX} />
		);

		// registration verify
		const addCall = addSpy.mock.calls.find(([type]) => type === 'keydown');
		expect(addCall).toBeTruthy();
		const handler = addCall?.[1] as (e: KeyboardEvent) => void;

		// mock the keydown event
		const preventDefault = jest.fn();
		const stopPropagation = jest.fn();
		const fakeEvent = {
			key: 'Escape',
			preventDefault,
			stopPropagation
		} as unknown as KeyboardEvent;

		handler(fakeEvent);

		expect(preventDefault).toHaveBeenCalled();
		expect(stopPropagation).toHaveBeenCalled();
		expect(mockNavigate).toHaveBeenCalled();

		addSpy.mockRestore();
	});
});
