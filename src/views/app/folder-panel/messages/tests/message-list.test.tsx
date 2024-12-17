/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { useParams } from 'react-router-dom';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { useFolderStore } from '../../../../../carbonio-ui-commons/store/zustand/folder';
import { generateFolder } from '../../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest, screen } from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateCompleteMessageFromAPI } from '../../../../../tests/generators/api';
import { FolderState } from '../../../../../types';
import { MessageList } from '../message-list';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

describe('MessageList Component', () => {
	it('should render without crashing', async () => {
		const searchResponse = {
			m: [generateCompleteMessageFromAPI({ id: '1' })],
			more: false
		};
		createSoapAPIInterceptor('Search', searchResponse);
		populateFoldersStore();
		const folderId = FOLDERS.INBOX;
		(useParams as jest.Mock).mockReturnValue({ folderId });
		setupTest(<MessageList />);
		expect(await screen.findByTestId(`message-list-${folderId}`)).toBeInTheDocument();
	});

	it('should display the correct displayer title based on folderId', async () => {
		const searchResponse = {
			m: [],
			more: false
		};
		createSoapAPIInterceptor('Search', searchResponse);
		const folder = generateFolder({ id: FOLDERS.SPAM, n: 0, l: FOLDERS.ROOT });
		const initialStoreState: FolderState = {
			linksIdMap: {},
			folders: { [folder.id]: folder },
			searches: {},
			updateFolder: jest.fn()
		};
		useFolderStore.setState(initialStoreState, true);
		const folderId = FOLDERS.SPAM;
		(useParams as jest.Mock).mockReturnValue({ folderId });
		setupTest(<MessageList />);
		expect(await screen.findByText(/There are no spam e-mails/)).toBeVisible();
	});

	it('should render the correct number of list items', async () => {
		const searchResponse = {
			m: [
				generateCompleteMessageFromAPI({ id: '1', l: FOLDERS.INBOX }),
				generateCompleteMessageFromAPI({ id: '2', l: FOLDERS.INBOX }),
				generateCompleteMessageFromAPI({ id: '3', l: FOLDERS.INBOX })
			],
			more: false
		};
		createSoapAPIInterceptor('Search', searchResponse);
		populateFoldersStore();
		const folderId = FOLDERS.INBOX;
		(useParams as jest.Mock).mockReturnValue({ folderId });
		setupTest(<MessageList />);
		expect(await screen.findAllByTestId('invisible-item')).toHaveLength(3);
	});
});
