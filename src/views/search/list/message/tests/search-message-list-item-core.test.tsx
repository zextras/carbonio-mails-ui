/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { FOLDERS, useTags, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { SearchMessageListItemCore } from 'views/search/list/message/search-message-list-item-core';

vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	useTags: vi.fn()
}));

vi.mock('../../../../../ui-actions/tag-actions', () => ({
	useTagExist: vi.fn().mockReturnValue(true)
}));

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

			const tagsFromStore = [{ id: 'tag1', name: 'Tag 1', color: 0 }];
			(useTags as Mock).mockReturnValue(tagsFromStore);

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
	describe('Tag Icon', () => {
		it('renders tag icon when tags are present and exist in store', async () => {
			const generatedMessages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '123', tags: ['tag1'], subject }]
			});

			const tagsFromStore = [{ id: 'tag1', name: 'Tag 1', color: 0 }];
			(useTags as Mock).mockReturnValue(tagsFromStore);

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

			expect(screen.getByTestId('TagIcon')).toBeInTheDocument();
		});

		it('does not render tag icon when tags are empty', async () => {
			const generatedMessages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '123', tags: [], subject }]
			});

			const tagsFromStore: { color: number; name: string; id: string }[] = [];
			(useTags as Mock).mockReturnValue(tagsFromStore);

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

			expect(screen.queryByTestId('TagIcon')).not.toBeInTheDocument();
		});

		it('renders tag icon with correct color when a single tag is present', async () => {
			const generatedMessages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '123', tags: ['tag1'], subject }]
			});

			const tagsFromStore = [{ id: 'tag1', name: 'Tag 1', color: 0 }];
			(useTags as Mock).mockReturnValue(tagsFromStore);

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

			const tagIcon = screen.getByTestId('TagIcon');
			expect(tagIcon).toHaveStyle(`color: ${ZIMBRA_STANDARD_COLORS[0].hex}`);
		});

		it('renders tag icon with default color when multiple tags are present', async () => {
			const generatedMessages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '123', tags: ['tag1', 'tag2'], subject }]
			});

			const tagsFromStore = [
				{ id: 'tag1', name: 'Tag 1', color: 0 },
				{ id: 'tag2', name: 'Tag 2', color: 1 }
			];
			(useTags as Mock).mockReturnValue(tagsFromStore);

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

			const tagIcon = screen.getByTestId('TagIcon');
			expect(tagIcon).toHaveStyle('color: rgb(51,51,51)');
		});
	});
});
