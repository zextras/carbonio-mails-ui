/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { FOLDERS, useTagStore, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import {
	populateFoldersStore,
	SHARED_FOLDER_ID,
	SHARED_FOLDER_LINK,
	SHARED_FOLDER_OWNER
} from '@test-utils/store/folders';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { SearchMessageListItemCore } from 'views/search/list/message/search-message-list-item-core';

const mockToggle = vi.fn();

describe('SearchMessageListItemCore', () => {
	const subject = 'Test Subject';

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('render test', () => {
		it('renders message subject correctly', async () => {
			const subject2 = 'Test Subject 2';
			const generatedMessages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '123', tags: ['tag1'], subject: subject2 }]
			});

			useTagStore.setState({ tags: { tag1: { id: 'tag1', name: 'Tag 1', color: 0 } } });

			setupTest(
				<SearchMessageListItemCore
					completeMessage={generatedMessages[0]}
					selected={false}
					selecting={false}
					index={0}
					onSelect={mockToggle}
					folderId={FOLDERS.INBOX}
				/>
			);

			const subjectElement = screen.getByTestId('Subject');
			expect(subjectElement.innerHTML).toBe(subject2);
		});
	});
	describe('tags', () => {
		const renderWithTags = (messageTags: Array<string>): void => {
			const generatedMessages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '123', tags: messageTags, subject }]
			});
			setupTest(
				<SearchMessageListItemCore
					completeMessage={generatedMessages[0]}
					selected={false}
					selecting={false}
					index={0}
					onSelect={mockToggle}
					folderId={FOLDERS.INBOX}
				/>
			);
		};

		it('a tag from a shared folder says whose folder it comes from', async () => {
			useTagStore.setState({ tags: {} });
			populateFoldersStore({ additionalFolders: SHARED_FOLDER_LINK });
			const [message] = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{ id: '123', tags: ['nil:Finance'], subject, folderId: SHARED_FOLDER_ID }
				]
			});
			const { user } = setupTest(
				<SearchMessageListItemCore
					completeMessage={message}
					selected={false}
					selecting={false}
					index={0}
					onSelect={mockToggle}
					folderId={SHARED_FOLDER_ID}
				/>
			);

			await user.hover(screen.getByText('Finance'));

			expect(await screen.findByText(`Tag from ${SHARED_FOLDER_OWNER}'s folder`)).toBeVisible();
		});

		it('tints the pill with the custom colour of the tag', () => {
			useTagStore.setState({ tags: { tag1: { id: 'tag1', name: 'Tag 1', rgb: '#abcdef' } } });

			renderWithTags(['tag1']);

			expect(screen.getByTestId('tag-dot')).toHaveStyle({ 'background-color': '#abcdef' });
		});

		it('shows a pill named after the tag with its standard colour', () => {
			useTagStore.setState({ tags: { tag1: { id: 'tag1', name: 'Tag 1', color: 0 } } });

			renderWithTags(['tag1']);

			expect(screen.getByTestId('tag-pill')).toHaveTextContent('Tag 1');
			expect(screen.getByTestId('tag-dot')).toHaveStyle({
				'background-color': ZIMBRA_STANDARD_COLORS[0].hex
			});
		});

		it('shows no pill when the message has no tags', () => {
			useTagStore.setState({ tags: {} });

			renderWithTags([]);

			expect(screen.queryByTestId('tag-pill')).not.toBeInTheDocument();
		});

		it('shows a pill for each tag, alphabetically', () => {
			useTagStore.setState({
				tags: {
					tag1: { id: 'tag1', name: 'Zeta', color: 0 },
					tag2: { id: 'tag2', name: 'Alpha', color: 1 }
				}
			});

			renderWithTags(['tag1', 'tag2']);

			expect(screen.getAllByTestId('tag-pill').map((pill) => pill.textContent)).toEqual([
				'Alpha',
				'Zeta'
			]);
		});
	});
});
