/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, waitFor } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-ui-soap-lib';
import { NavigateFunction, useParams } from 'react-router-dom';
import type { Mock } from 'vitest';

import { GetMsgRequest } from '../../../../../types/soap';
import { setupTest, screen, within } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { generateMessage, populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { setSearchResultsByMessage } from 'store/emails/store';
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

		setupTest(<SearchMessagePanel messageId="1" />);

		expect(await screen.findByTestId('MessagePanel-1')).toBeVisible();
		expect(await screen.findByText('Test subject')).toBeInTheDocument();
		expect(await screen.findByText('Test Message body')).toBeInTheDocument();
	});
	it('should redirect when messageStatus is error', async () => {
		const messages = await act(() => populateMessagesInEmailStore());
		const response: ErrorSoapBodyResponse = buildSoapErrorResponseBody();

		const interceptor = createSoapAPIInterceptor<GetMsgRequest, ErrorSoapBodyResponse>(
			'GetMsg',
			response
		);
		setupTest(<SearchMessagePanel messageId={messages[0].id} />, {
			initialEntries: [`/message/${messages[0].id}`],
			path: '/message/:messageId'
		});
		await act(async () => {
			await interceptor;
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
