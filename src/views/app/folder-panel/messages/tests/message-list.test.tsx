/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { useFolderStore } from '../../../../../carbonio-ui-commons/store/zustand/folder';
import { generateFolder } from '../../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import {
	setupTest,
	screen,
	triggerLoadMore
} from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateCompleteMessageFromAPI } from '../../../../../tests/generators/api';
import { FolderState } from '../../../../../types';
import { makeAllItemsVisible } from '../../../../settings/filters/tests/test-utils';
import { MessageList } from '../message-list';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

describe('message-list', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const invisibleItemTestId = 'invisible-item';

	it('should render without crashing', async () => {
		populateFoldersStore();
		const folderId = FOLDERS.INBOX;
		const searchResponse = {
			m: [generateCompleteMessageFromAPI({ id: '1', l: folderId })],
			more: false
		};
		createSoapAPIInterceptor('Search', searchResponse);
		(useParams as jest.Mock).mockReturnValue({ folderId });

		setupTest(<MessageList />);

		expect(await screen.findByTestId(`message-list-${folderId}`)).toBeInTheDocument();
	});

	const displayerTitleTestCases = [
		{ folderId: FOLDERS.SPAM, expectedText: 'There are no spam e-mails' },
		{ folderId: FOLDERS.SENT, expectedText: 'You haven’t sent any e-mail yet' },
		{ folderId: FOLDERS.DRAFTS, expectedText: 'There are no saved drafts' },
		{ folderId: FOLDERS.TRASH, expectedText: 'The trash is empty' },
		{ folderId: 'someOtherFolder', expectedText: 'It looks like there are no e-mails yet' }
	];

	test.each(displayerTitleTestCases)(
		'should display the correct displayer title for folderId: $folderId',
		async ({ folderId, expectedText }) => {
			const searchResponse = {
				m: [],
				more: false
			};
			createSoapAPIInterceptor('Search', searchResponse);
			const folder = generateFolder({ id: folderId, n: 0, l: FOLDERS.ROOT });
			const initialStoreState: FolderState = {
				linksIdMap: {},
				folders: { [folder.id]: folder },
				searches: {},
				updateFolder: jest.fn()
			};
			useFolderStore.setState(initialStoreState, true);
			(useParams as jest.Mock).mockReturnValue({ folderId });

			setupTest(<MessageList />);

			expect(await screen.findByText(new RegExp(expectedText, 'i'))).toBeVisible();
		}
	);

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

		expect(await screen.findAllByTestId(invisibleItemTestId)).toHaveLength(3);
	});

	const message1Subject = 'message 1 subject';
	it('loads more messages when reaching bottom of the list', async () => {
		populateFoldersStore();
		const folderId = FOLDERS.INBOX;
		(useParams as jest.Mock).mockReturnValue({ folderId });

		const searchResponse = {
			m: [generateCompleteMessageFromAPI({ id: '1', su: message1Subject, l: folderId })],
			more: true
		};
		createSoapAPIInterceptor('Search', searchResponse);

		setupTest(<MessageList />);

		expect(await screen.findAllByTestId(invisibleItemTestId)).toHaveLength(1);

		makeAllItemsVisible();

		expect(screen.getByText(/message 1 subject/i)).toBeInTheDocument();

		const searchResponse2 = {
			m: [generateCompleteMessageFromAPI({ id: '2', su: 'message 2 subject', l: folderId })],
			more: false
		};

		createSoapAPIInterceptor('Search', searchResponse2);

		await act(async () => {
			triggerLoadMore();
		});

		makeAllItemsVisible();

		expect(screen.getByText(/message 1 subject/i)).toBeInTheDocument();
		expect(screen.getByText(/message 2 subject/i)).toBeInTheDocument();
	});

	it('list-bottom-element should not be in the document when there are no more messages', async () => {
		populateFoldersStore();
		const folderId = FOLDERS.INBOX;
		(useParams as jest.Mock).mockReturnValue({ folderId });

		const searchResponse = {
			m: [generateCompleteMessageFromAPI({ id: '1', l: folderId, su: message1Subject })],
			more: false
		};

		createSoapAPIInterceptor('Search', searchResponse);

		setupTest(<MessageList />);

		expect(await screen.findAllByTestId(invisibleItemTestId)).toHaveLength(1);

		makeAllItemsVisible();

		expect(screen.getByText(/message 1 subject/i)).toBeInTheDocument();
		expect(screen.queryByTestId('list-bottom-element')).not.toBeInTheDocument();
	});

	it('list-bottom-element should be in the document when there are more messages', async () => {
		populateFoldersStore();
		const folderId = FOLDERS.INBOX;
		(useParams as jest.Mock).mockReturnValue({ folderId });

		const searchResponse = {
			m: [generateCompleteMessageFromAPI({ id: '1', l: folderId, su: message1Subject })],
			more: true
		};

		createSoapAPIInterceptor('Search', searchResponse);

		setupTest(<MessageList />);

		expect(await screen.findAllByTestId(invisibleItemTestId)).toHaveLength(1);

		makeAllItemsVisible();

		expect(screen.getByText(/message 1 subject/i)).toBeInTheDocument();
		expect(screen.getByTestId('list-bottom-element')).toBeInTheDocument();
	});

	describe('totalMessages count in BreadCrumb', () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should render correct totalMessages count in BreadcrumbCount', async () => {
			populateFoldersStore();
			const folderId = FOLDERS.INBOX;
			const searchResponse = {
				m: [generateCompleteMessageFromAPI({ id: '1', l: folderId })],
				more: false
			};
			createSoapAPIInterceptor('Search', searchResponse);
			(useParams as jest.Mock).mockReturnValue({ folderId });

			setupTest(<MessageList />);

			const breadcrumbCountElement = screen.getByTestId('BreadcrumbCount');
			expect(breadcrumbCountElement).toBeInTheDocument();
			await waitFor(() => expect(breadcrumbCountElement.innerHTML).toBe('1'));
		});

		it('should render correct totalMessages count in BreadcrumbCount when more items loaded using loadMore', async () => {
			populateFoldersStore();
			const folderId = FOLDERS.INBOX;
			const initialMessages = Array.from({ length: 100 }, (_, i) =>
				generateCompleteMessageFromAPI({ id: `${i + 1}`, l: folderId })
			);
			const searchResponse = {
				m: initialMessages,
				more: true
			};
			createSoapAPIInterceptor('Search', searchResponse);
			(useParams as jest.Mock).mockReturnValue({ folderId });

			setupTest(<MessageList />);

			const breadcrumbCountElement = screen.getByTestId('BreadcrumbCount');
			expect(breadcrumbCountElement).toBeInTheDocument();
			await waitFor(() => expect(breadcrumbCountElement.innerHTML).toBe('100'));

			const moreMessages = Array.from({ length: 100 }, (_, i) =>
				generateCompleteMessageFromAPI({ id: `${i + 101}`, l: folderId })
			);
			const searchResponse2 = {
				m: moreMessages,
				more: false
			};
			createSoapAPIInterceptor('Search', searchResponse2);

			await act(async () => {
				triggerLoadMore();
			});

			const breadcrumbCountElementAfterLoadMore = screen.getByTestId('BreadcrumbCount');
			expect(breadcrumbCountElementAfterLoadMore).toBeInTheDocument();
			await waitFor(() => expect(breadcrumbCountElementAfterLoadMore.innerHTML).toBe('200'));
		});
	});
});
