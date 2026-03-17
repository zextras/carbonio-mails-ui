/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { useTheme } from '@zextras/carbonio-design-system';
import { useTags } from '@zextras/carbonio-ui-commons';
import type { Mock } from 'vitest';

import { setupHook, setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { tags } from '@test-utils/tags/tags';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { ConversationListItemCore } from 'views/app/folder-panel/conversations/conversation-list-item-core';

vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	useTags: vi.fn()
}));

const mockToggleOpen = vi.fn();
const tagsArray = Object.values(tags);

describe('ConversationListItemCore', () => {
	beforeEach(() => {
		(useTags as Mock).mockReturnValue(tags);
	});

	it('renders conversation details correctly', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();
		setupTest(
			<ConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		expect(await screen.findByText('Test Subject')).toBeInTheDocument();
		expect(await screen.findByTestId('FolderBadge')).toHaveTextContent('3');
	});

	it('displays unread status correctly', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();

		const {
			result: { current: theme }
		} = setupHook(useTheme);

		setupTest(
			<ConversationListItemCore
				conversation={{ ...conversation, read: false }}
				selected={false}
				selecting={false}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		expect(screen.getByText('Test Subject')).toHaveStyle({
			'font-weight': theme.fonts.weight.bold
		});
	});

	it('calls toggleCollapseElementCallback when expand button is clicked', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();

		const { user } = setupTest(
			<ConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		const expandButton = await screen.findByTestId('ToggleExpand');
		await user.click(expandButton);

		expect(mockToggleOpen).toHaveBeenCalledTimes(1);
	});

	it('shows urgent icon if conversation is urgent', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();

		setupTest(
			<ConversationListItemCore
				conversation={{ ...conversation, urgent: true }}
				selected={false}
				selecting={false}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		expect(screen.getByTestId('UrgentIcon')).toBeInTheDocument();
	});

	it('renders the avatar with correct data-testid', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();

		setupTest(
			<ConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		expect(screen.getByTestId('conversation-list-item-avatar-123')).toBeInTheDocument();
	});

	it('should remove FWD: prefix when it appears at the start of the subject', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'FWD: Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();
		setupTest(
			<ConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		expect(await screen.findByText('Test Subject')).toBeInTheDocument();
		expect(screen.queryByText('FWD: Test Subject')).not.toBeInTheDocument();
	});

	it('should remove RE: prefix when it appears at the start of the subject', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: {
					id: '123',
					tags: [tagsArray[0].name],
					subject: 'RE: Test Subject'
				},
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();
		setupTest(
			<ConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		expect(await screen.findByText('Test Subject')).toBeInTheDocument();
		expect(screen.queryByText('RE: Test Subject')).not.toBeInTheDocument();
	});
	it('should preserve RE: or FWD: when not at the beginning of the subject', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: {
					id: '123',
					tags: [tagsArray[0].name],
					subject: 'Test RE: FWD: Subject'
				},
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();
		setupTest(
			<ConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		expect(await screen.findByText('Test RE: FWD: Subject')).toBeInTheDocument();
	});
});
