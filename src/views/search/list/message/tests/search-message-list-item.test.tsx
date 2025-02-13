/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { waitFor, screen } from '@testing-library/react';
import { AccountSettings } from '@zextras/carbonio-shell-ui';

import { useUserSettings } from '../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateSettings } from '../../../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { CONVACTIONS } from '../../../../../commons/utilities';
import { populateConversationInEmailStore } from '../../../../../tests/generators/generateConversation';
import { MsgActionRequest, MsgActionResponse } from '../../../../../types';
import { SearchMessageListItem } from '../search-message-list-item';

it('should delete the item when clicking on Delete action when in message mode', async () => {
	const customSettings: Partial<AccountSettings> = {
		prefs: {
			zimbraPrefGroupMailBy: 'message'
		}
	};
	const settings = generateSettings(customSettings);
	useUserSettings.mockReturnValue(settings);

	const { messages } = await waitFor(() =>
		populateConversationInEmailStore({
			conversationParams: { subject: 'Test Subject' },
			conversationMessagesNumber: 3
		})
	);
	const interceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>('MsgAction', {
		action: { op: CONVACTIONS.TRASH, id: '100' }
	});

	const { user } = setupTest(
		<SearchMessageListItem
			completeMessage={messages[0]}
			selecting={false}
			active={false}
			toggle={jest.fn()}
			selected={false}
			deselectAll={jest.fn()}
		/>
	);

	const messageActionWrapper = screen.getByTestId(`MessageListItem-100`);
	expect(messageActionWrapper).toBeVisible();

	act(() => {
		user.hover(messageActionWrapper);
	});
	const hoverBar = await screen.findByTestId(`primary-actions-bar-100`);
	expect(hoverBar).toBeVisible();

	act(() => {
		user.click(screen.getByTestId('icon: Trash2Outline'));
	});
	const request = await interceptor;
	expect(request.action).toStrictEqual({ id: '100', op: CONVACTIONS.TRASH });
});
