/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';
import { NavigateFunction } from 'react-router-dom';

import { populateMessagesInEmailStore } from '../../../../__test__/generators/generateMessage';
import { updateMessageStatus } from '../../../../store/emails/store';
import { ConversationMessagePreviewWrapper } from '../conversation-message-preview-wrapper';
import { setupTest } from '@test-setup';

const mockNavigateSpy = vi.fn();

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useNavigate: (): NavigateFunction => mockNavigateSpy
}));

describe('conversation-message-preview-wrapper', () => {
	test('when messageStatus has an error it will redirect', async () => {
		const messages = await act(() => populateMessagesInEmailStore());
		await act(() => updateMessageStatus(messages[0].id, 'error'));

		setupTest(
			<ConversationMessagePreviewWrapper
				convMessageId={messages[0].id}
				isExpanded={false}
				isAlone
			/>,
			{
				initialEntries: [`/folder/${messages[0].parent}/conversation/${messages[0].conversation}`],
				path: '/folder/:folderId/conversation/:conversationId'
			}
		);

		expect(mockNavigateSpy).toHaveBeenCalledWith('/mails/folder/2', { replace: true });
	});
});
