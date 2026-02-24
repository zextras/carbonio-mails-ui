/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, waitFor } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { NavigateFunction, useParams } from 'react-router-dom';
import type { Mock } from 'vitest';

import { setupTest, screen, within } from '@test-setup';
import { generateMessage, populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { API_REQUEST_STATUS } from 'constants/index';
import { setSearchResultsByMessage, updateMessageStatus } from 'store/emails/store';
import { SearchMessagePanel } from 'views/search/panel/message/search-message-panel';

const mockNavigateSpy = vi.fn();

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useParams: vi.fn(),
	useNavigate: (): NavigateFunction => mockNavigateSpy
}));

describe('Message Panel', () => {
	it('should render a message when status fulfilled', async () => {
		(useParams as Mock).mockReturnValue({ messageId: '1' });
		setSearchResultsByMessage(
			[
				generateMessage({
					id: '1',
					isComplete: true,
					subject: 'Test subject',
					body: 'Test Message body'
				})
			],
			false
		);

		await waitFor(() => {
			updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);
		});

		setupTest(<SearchMessagePanel messageId="1" />);

		expect(await screen.findByTestId('MessagePanel-1')).toBeVisible();
		expect(await screen.findByText('Test subject')).toBeInTheDocument();
		expect(await screen.findByText('Test Message body')).toBeInTheDocument();
	});
	it('should redirect when messageStatus is error', async () => {
		const messages = await act(() => populateMessagesInEmailStore());
		await act(() => updateMessageStatus(messages[0].id, 'error'));

		setupTest(<SearchMessagePanel messageId={messages[0].id} />, {
			initialEntries: [`/message/${messages[0].id}`],
			path: '/message/:messageId'
		});

		expect(mockNavigateSpy).toHaveBeenCalledWith('/search', { replace: true });
	});

	it('should open warning dialog when clicking edit action on scheduled draft message in preview panel', async () => {
		(useParams as Mock).mockReturnValue({ messageId: '1' });
		setSearchResultsByMessage(
			[
				generateMessage({
					id: '1',
					isComplete: true,
					subject: 'Scheduled Draft Subject',
					body: 'Test Message body',
					isScheduled: true,
					folderId: FOLDERS.DRAFTS,
					isDraft: true
				})
			],
			false
		);

		await waitFor(() => {
			updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);
		});

		const { user } = setupTest(<SearchMessagePanel messageId="1" />);

		// Wait for the message panel to appear
		expect(await screen.findByTestId(`SearchMessagePanel-1`)).toBeInTheDocument();

		// Wait for the message content to load
		await waitFor(() => {
			expect(screen.getByText('Scheduled Draft Subject')).toBeInTheDocument();
		});

		// Find and click the edit action button in the preview header
		const editButton = await screen.findByTestId('icon: Edit2Outline');
		expect(editButton).toBeInTheDocument();

		await user.click(editButton);

		// Verify warning modal appears
		const modal = await screen.findByTestId('modal');
		expect(modal).toBeInTheDocument();

		// Verify modal title
		expect(within(modal).getByText('label.warning')).toBeInTheDocument();

		// Verify modal message about delayed sending
		expect(within(modal).getByText('messages.edit_schedule_warning')).toBeInTheDocument();

		// Verify "Edit anyway" button exists
		const editAnywayButton = within(modal).getByRole('button', {
			name: 'action.edit_anyway'
		});
		expect(editAnywayButton).toBeInTheDocument();
	});
});
