/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-ui-soap-lib';
import { NavigateFunction } from 'react-router-dom';

import { populateMessagesInEmailStore } from '../../../../__test__/generators/generateMessage';
import { GetMsgRequest } from '../../../../types/soap';
import { ConversationMessagePreviewWrapper } from '../conversation-message-preview-wrapper';
import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';

const mockNavigateSpy = vi.fn();

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useNavigate: (): NavigateFunction => mockNavigateSpy
}));

describe('conversation-message-preview-wrapper', () => {
	test('when messageStatus has an error it will redirect', async () => {
		const messages = await act(() => populateMessagesInEmailStore());
		const response: ErrorSoapBodyResponse = buildSoapErrorResponseBody();

		const interceptor = createSoapAPIInterceptor<GetMsgRequest, ErrorSoapBodyResponse>(
			'GetMsg',
			response
		);
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
		await act(async () => {
			await interceptor;
		});
		expect(mockNavigateSpy).toHaveBeenCalledWith('/mails/folder/2', { replace: true });
	});
});
