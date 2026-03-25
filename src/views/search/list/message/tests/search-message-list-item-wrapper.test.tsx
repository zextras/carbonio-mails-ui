/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import * as storeModule from 'store/emails/store';
import { MailMessage } from 'types/messages';
import { SearchMessageListItemWrapper } from 'views/search/list/message/search-message-list-item-wrapper';

describe('SearchMessageListItemWrapper', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders nothing when message is not found', () => {
		const useMessageByIdSpy = vi.spyOn(storeModule, 'useMessageById').mockReturnValue(undefined);

		const { container } = render(
			<SearchMessageListItemWrapper
				messageId="1"
				selected={false}
				selecting={false}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		expect(container).toBeEmptyDOMElement();
		useMessageByIdSpy.mockRestore();
	});

	it('renders SearchMessageListItem with message fragment when message is found', async () => {
		let generatedMessages: Array<MailMessage> = [];
		await waitFor(() => {
			generatedMessages = populateMessagesInEmailStore({
				messageGeneratorParams: [{ id: '1', subject: 'Test Subject' }]
			});
		});

		setupTest(
			<SearchMessageListItemWrapper
				messageId={generatedMessages[0].id}
				selected={false}
				selecting={false}
				index={0}
				onSelect={vi.fn()}
				active
			/>
		);

		if (generatedMessages[0]?.fragment) {
			const fragmentElement = screen.getByTestId('Fragment');
			expect(fragmentElement).toBeInTheDocument();
			expect(fragmentElement).toHaveTextContent(`- ${generatedMessages[0].fragment}`);
		}
	});
});
